defmodule :"Elixir.Api.Repo.Migrations.Drop-existing-user-model" do
  use Ecto.Migration

  def change do
    # Remove user_id from pixels table
    alter table(:pixels) do
      remove :user_id
    end

    # Drop accounts table
    drop table(:accounts)

    # Remove is_oauth_user from users table
    alter table(:users) do
      remove :is_oauth_user
    end
  end
end
