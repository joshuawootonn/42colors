defmodule Api.Repo.Migrations.BackfillLogsWithHistoricalData do
  use Ecto.Migration

  def up do
    # Step 1: Create initial grant logs for all existing users
    create_initial_grant_logs()

    # Step 2: Create plot creation logs for all existing plots
    create_plot_creation_logs()

    # Step 3: Update user balances to reflect actual balance after plot costs
    update_user_balances()
  end

  def down do
    # Remove all backfilled logs (they will have specific characteristics we can identify)
    execute """
    DELETE FROM logs
    WHERE log_type IN ('initial_grant', 'plot_created')
    AND inserted_at >= '#{DateTime.utc_now() |> DateTime.add(-1, :hour) |> DateTime.to_iso8601()}'
    """

    # Restore user balances to default 2000
    execute "UPDATE users SET balance = 2000"
  end

  # Create initial grant logs for all users
  defp create_initial_grant_logs do
    execute """
    INSERT INTO logs (user_id, old_balance, new_balance, log_type, diffs, inserted_at, updated_at)
    SELECT
      u.id as user_id,
      0 as old_balance,
      2000 as new_balance,
      'initial_grant' as log_type,
      '{}' as diffs,
      u.inserted_at as inserted_at,
      u.inserted_at as updated_at
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM logs l
      WHERE l.user_id = u.id
      AND l.log_type = 'initial_grant'
    )
    """
  end

  # Create plot creation logs for all existing plots
  defp create_plot_creation_logs do
    execute """
    INSERT INTO logs (user_id, plot_id, old_balance, new_balance, log_type, diffs, inserted_at, updated_at)
    SELECT
      p.user_id,
      p.id as plot_id,
      2000 as old_balance,  -- We'll calculate proper balances in next step
      2000 - COALESCE(ST_Area(p.polygon), 0)::integer as new_balance,
      'plot_created' as log_type,
      json_build_object(
        'name', json_build_object('old', null, 'new', p.name),
        'description', json_build_object('old', null, 'new', p.description),
        'polygon', json_build_object(
          'old_pixel_count', 0,
          'new_pixel_count', COALESCE(ST_Area(p.polygon), 0)::integer
        )
      ) as diffs,
      p.inserted_at as inserted_at,
      p.inserted_at as updated_at
    FROM plots p
    WHERE p.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM logs l
      WHERE l.plot_id = p.id
      AND l.log_type = 'plot_created'
    )
    ORDER BY p.user_id, p.inserted_at
    """
  end

  # Update user balances and fix log balance tracking
  defp update_user_balances do
    # First, calculate the correct balance progression for each user
    execute """
    WITH user_plot_costs AS (
      SELECT
        p.user_id,
        p.id as plot_id,
        COALESCE(ST_Area(p.polygon), 0)::integer as pixel_cost,
        p.inserted_at,
        ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.inserted_at) as plot_order
      FROM plots p
      WHERE p.deleted_at IS NULL
    ),
    balance_progression AS (
      SELECT
        user_id,
        plot_id,
        pixel_cost,
        inserted_at,
        plot_order,
        2000 - SUM(pixel_cost) OVER (
          PARTITION BY user_id
          ORDER BY inserted_at
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) as running_balance,
        2000 - SUM(pixel_cost) OVER (
          PARTITION BY user_id
          ORDER BY inserted_at
          ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) as prev_balance
      FROM user_plot_costs
    )
    UPDATE logs
    SET
      old_balance = COALESCE(bp.prev_balance, 2000),
      new_balance = bp.running_balance
    FROM balance_progression bp
    WHERE logs.plot_id = bp.plot_id
    AND logs.log_type = 'plot_created'
    """

    # Update final user balances
    execute """
    UPDATE users
    SET balance = (
      SELECT COALESCE(
        2000 - SUM(COALESCE(ST_Area(p.polygon), 0)::integer),
        2000
      )
      FROM plots p
      WHERE p.user_id = users.id
      AND p.deleted_at IS NULL
    )
    """
  end
end
