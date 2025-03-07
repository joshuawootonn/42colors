defmodule Api.Repo.Migrations.RemoveNullabilityFromUserIdInPixels do
  use Ecto.Migration

  def change do
    drop constraint(:pixels, :pixels_user_id_fkey)

    alter table(:pixels) do
      modify(
        :user_id,
        references(:users),
        null: false
      )
    end
  end
end
