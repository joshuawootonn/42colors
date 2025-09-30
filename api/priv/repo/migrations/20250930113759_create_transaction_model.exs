defmodule Api.Repo.Migrations.CreateLogModel do
  use Ecto.Migration

  def change do
    # Add balance field to users table
    alter table(:users) do
      add :balance, :integer, default: 500, null: false
    end

    # Backfill existing users with initial balance
    execute "UPDATE users SET balance = 500 WHERE balance IS NULL", ""

    # Create logs table
    create table(:logs) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :amount, :integer, null: false
      add :log_type, :string, null: false
      add :plot_id, references(:plots, on_delete: :nilify_all)
      add :metadata, :map

      timestamps(type: :utc_datetime)
    end

    create index(:logs, [:user_id])
    create index(:logs, [:plot_id])
    create index(:logs, [:log_type])
    create index(:logs, [:inserted_at])

    # Add claim tracking fields to plots
    alter table(:plots) do
      add :deleted_at, :utc_datetime
    end
  end
end
