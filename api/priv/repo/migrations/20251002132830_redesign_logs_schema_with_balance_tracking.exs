defmodule Api.Repo.Migrations.RedesignLogsSchemaWithBalanceTracking do
  use Ecto.Migration

  def change do
    # Drop all existing log data since this is not in production
    execute "DELETE FROM logs", ""

    # Redesign the logs table schema
    alter table(:logs) do
      # Remove the balance_diff column (was renamed from amount in previous migration)
      remove :amount
      remove :metadata

      # Add new balance tracking columns
      add :old_balance, :integer, null: false
      add :new_balance, :integer, null: false
      add :diffs, :map
    end
  end
end
