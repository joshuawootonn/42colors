defmodule :"Elixir.Api.Repo.Migrations.Recreate-basic-auth-gen" do
  use Ecto.Migration

  def change do
    execute "TRUNCATE TABLE users"

    create table(:users_tokens) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token, :binary, null: false
      add :context, :string, null: false
      add :sent_to, :string

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:users_tokens, [:user_id])
    create unique_index(:users_tokens, [:context, :token])

    # Add non-null constraint to hashed_password in users table
    alter table(:users) do
      modify :hashed_password, :string, null: false
    end
  end
end
