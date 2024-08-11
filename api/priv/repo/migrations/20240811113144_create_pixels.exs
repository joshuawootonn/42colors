defmodule Api.Repo.Migrations.CreatePixels do
  use Ecto.Migration

  def change do
    create table(:pixels) do
      add :x, :integer
      add :y, :integer

      timestamps(type: :utc_datetime)
    end
  end
end
