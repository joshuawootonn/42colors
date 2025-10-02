defmodule Api.Repo.Migrations.AddBailoutGrantLogs do
  use Ecto.Migration

  def up do
    # Create bailout grant logs for users who have less than 2000 balance
    # This will bring everyone back up to the default 2000 pixels
    create_bailout_grant_logs()

    # Update user balances to 2000 for those who received bailout grants
    update_user_balances_to_default()
  end

  def down do
    # Remove bailout grant logs
    execute "DELETE FROM logs WHERE log_type = 'bailout_grant'"

    # Note: We don't restore the original balances as this would be complex
    # and the bailout is meant to be a one-way operation
  end

  # Create bailout grant logs for users with balance < 2000
  defp create_bailout_grant_logs do
    execute """
    INSERT INTO logs (user_id, old_balance, new_balance, log_type, diffs, inserted_at, updated_at)
    SELECT
      u.id as user_id,
      u.balance as old_balance,
      2000 as new_balance,
      'bailout_grant' as log_type,
      '{}' as diffs,
      NOW() as inserted_at,
      NOW() as updated_at
    FROM users u
    WHERE u.balance < 2000
    AND NOT EXISTS (
      SELECT 1 FROM logs l
      WHERE l.user_id = u.id
      AND l.log_type = 'bailout_grant'
    )
    """
  end

  # Update user balances to 2000 for those who received bailout grants
  defp update_user_balances_to_default do
    execute """
    UPDATE users
    SET balance = 2000
    WHERE balance < 2000
    AND EXISTS (
      SELECT 1 FROM logs l
      WHERE l.user_id = users.id
      AND l.log_type = 'bailout_grant'
    )
    """
  end
end
