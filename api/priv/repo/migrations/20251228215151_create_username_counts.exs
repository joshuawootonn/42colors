defmodule Api.Repo.Migrations.CreateUsernameCounts do
  use Ecto.Migration

  def change do
    create table(:username_counts) do
      add :color_id, references(:colors, on_delete: :restrict), null: false
      add :count, :integer, default: 0, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:username_counts, [:color_id])
  end
end
