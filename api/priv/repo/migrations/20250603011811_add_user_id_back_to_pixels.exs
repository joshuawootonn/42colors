defmodule Api.Repo.Migrations.AddUserIdBackToPixels do
  use Ecto.Migration

  def change do
    alter table(:pixels) do
      add :user_id,
          references(:users, on_delete: :delete_all),
          null: true
    end
  end
end
