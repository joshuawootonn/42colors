defmodule Api.Repo.Migrations.BackfillPlotLogs do
  use Ecto.Migration
  import Ecto.Query

  def up do
    # Get all users who have plots but no initial_grant log
    users_needing_grants =
      from(u in "users",
        left_join: initial_log in "logs",
        on: initial_log.user_id == u.id and initial_log.log_type == "initial_grant",
        join: p in "plots",
        on: p.user_id == u.id and is_nil(p.deleted_at),
        where: is_nil(initial_log.id),
        group_by: [u.id, u.inserted_at],
        select: %{
          user_id: u.id,
          user_inserted_at: u.inserted_at
        }
      )
      |> repo().all()

    IO.puts("Found #{length(users_needing_grants)} users needing initial grants")

    # Give each user an initial grant based on their total plot pixels + 2000 buffer
    Enum.each(users_needing_grants, fn user ->
      # Calculate total pixels for this user's plots
      total_pixels =
        from(p in "plots",
          where: p.user_id == ^user.user_id and is_nil(p.deleted_at),
          select: p.polygon
        )
        |> repo().all()
        |> Enum.map(&calculate_pixel_count/1)
        |> Enum.sum()

      grant_amount = total_pixels + 2000

      IO.puts("User #{user.user_id}: #{total_pixels} pixels claimed, granting #{grant_amount}")

      # Create initial_grant log
      repo().insert_all("logs", [
        %{
          user_id: user.user_id,
          amount: grant_amount,
          log_type: "initial_grant",
          plot_id: nil,
          metadata: %{
            reason: "Initial grant to cover existing plots",
            total_pixels_already_claimed: total_pixels,
            initial_grant_amount: 2000
          },
          # Use user creation time
          inserted_at: user.user_inserted_at,
          updated_at: user.user_inserted_at
        }
      ])

      # Update user balance
      execute("""
        UPDATE users
        SET balance = #{grant_amount}
        WHERE id = #{user.user_id}
      """)
    end)

    # Now get all existing plots that don't have creation logs
    plots_without_logs =
      from(p in "plots",
        left_join: l in "logs",
        on: l.plot_id == p.id and l.log_type == "plot_created",
        where: is_nil(l.id) and is_nil(p.deleted_at),
        select: %{
          id: p.id,
          name: p.name,
          description: p.description,
          user_id: p.user_id,
          polygon: p.polygon,
          inserted_at: p.inserted_at
        }
      )
      |> repo().all()

    IO.puts("Found #{length(plots_without_logs)} plots without creation logs")

    # Create log entries for each plot
    Enum.each(plots_without_logs, fn plot ->
      # Calculate pixel count using PostGIS
      pixel_count = calculate_pixel_count(plot.polygon)
      # Negative because user spent currency
      cost = -pixel_count

      # Create the diffs array showing what was created
      diffs = [
        %{field: "name", old_value: nil, new_value: plot.name}
      ]

      # Add description diff if it exists
      diffs =
        if plot.description do
          [%{field: "description", old_value: nil, new_value: plot.description} | diffs]
        else
          diffs
        end

      # Add polygon diff
      diffs = [%{field: "polygon", old_pixel_count: 0, new_pixel_count: pixel_count} | diffs]

      # Insert the log entry
      repo().insert_all("logs", [
        %{
          user_id: plot.user_id,
          amount: cost,
          log_type: "plot_created",
          plot_id: plot.id,
          metadata: %{
            name: plot.name,
            description: plot.description,
            size: pixel_count,
            diffs: Enum.reverse(diffs)
          },
          # Use original plot creation time
          inserted_at: plot.inserted_at,
          updated_at: plot.inserted_at
        }
      ])

      # Deduct the cost from user balance
      execute("""
        UPDATE users
        SET balance = balance + #{cost}
        WHERE id = #{plot.user_id}
      """)

      IO.puts("Created log for plot #{plot.id} (#{plot.name}) - Cost: #{cost}")
    end)

    IO.puts(
      "Backfill completed: #{length(users_needing_grants)} initial grants, #{length(plots_without_logs)} plot logs"
    )
  end

  def down do
    # First, restore user balances by subtracting the amounts from backfilled logs
    execute("""
      UPDATE users
      SET balance = balance - logs.amount
      FROM logs
      WHERE users.id = logs.user_id
      AND (
        (logs.log_type = 'plot_created' AND EXISTS (
          SELECT 1 FROM plots
          WHERE plots.id = logs.plot_id
          AND plots.inserted_at = logs.inserted_at
        ))
        OR
        (logs.log_type = 'initial_grant' AND EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = logs.user_id
          AND u.inserted_at = logs.inserted_at
        ))
      )
    """)

    # Remove backfilled plot creation logs
    execute("""
      DELETE FROM logs
      WHERE log_type = 'plot_created'
      AND EXISTS (
        SELECT 1 FROM plots
        WHERE plots.id = logs.plot_id
        AND plots.inserted_at = logs.inserted_at
      )
    """)

    # Remove backfilled initial grant logs
    execute("""
      DELETE FROM logs
      WHERE log_type = 'initial_grant'
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = logs.user_id
        AND users.inserted_at = logs.inserted_at
      )
    """)

    IO.puts(
      "Restored user balances and removed backfilled logs (initial grants and plot creations)"
    )
  end

  # Helper function to calculate pixel count using PostGIS
  defp calculate_pixel_count(nil), do: 0

  defp calculate_pixel_count(polygon) do
    result =
      repo().query!(
        "SELECT ST_Area($1::geometry) as area",
        [polygon]
      )

    case result.rows do
      [[area]] when is_number(area) -> round(area)
      _ -> 0
    end
  end
end
