defmodule Api.Repo.Migrations.AddUserIdToPixel do
  use Ecto.Migration

  def change do
    alter table(:pixels) do
      add :user_id,
          references(:users, on_delete: :delete_all),
          null: true
    end

    execute """
    UPDATE pixels
    SET user_id = (
        SELECT id
        FROM users
        WHERE email = 'joshuawootonn@gmail.com'  
    )
    """
  end
end
