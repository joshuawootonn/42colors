defmodule Api.Repo.Migrations.ResetUsernamesToTransparent do
  use Ecto.Migration

  def up do
    # Get all users ordered by ID (registration order)
    users = repo().query!("SELECT id FROM users ORDER BY id ASC")

    # Regenerate username for each user based on their position (0-indexed)
    # Format: "transparent" for first user, "transparent1", "transparent2", etc. (NO DASHES)
    users.rows
    |> Enum.with_index()
    |> Enum.each(fn {[user_id], index} ->
      new_username = generate_username(index)

      repo().query!(
        "UPDATE users SET username = $1 WHERE id = $2",
        [new_username, user_id]
      )
    end)

    # Insert or update the username_counts table for transparent (color_id = 0)
    total_users = length(users.rows)

    if total_users > 0 do
      now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      # Try to insert, or update if already exists
      repo().query!("""
      INSERT INTO username_counts (color_id, count, inserted_at, updated_at)
      VALUES (0, #{total_users}, '#{now}', '#{now}')
      ON CONFLICT (color_id) DO UPDATE SET count = #{total_users}, updated_at = '#{now}'
      """)
    end
  end

  def down do
    # No rollback - usernames are just cosmetic
    :ok
  end

  defp generate_username(index) do
    if index == 0 do
      "transparent"
    else
      # NO DASHES - format is transparent1, transparent2, etc.
      "transparent#{index}"
    end
  end
end
