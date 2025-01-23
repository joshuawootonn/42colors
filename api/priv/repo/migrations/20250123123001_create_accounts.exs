defmodule Api.Repo.Migrations.CreateAccounts do
  use Ecto.Migration

  def change do
    create table(:accounts) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :scope, :string
      add :access_token, :string
      add :expires_in, :integer
      add :id_token, :string
      add :token_type, :string

      timestamps(type: :utc_datetime)
    end
  end
end
