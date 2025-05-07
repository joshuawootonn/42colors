defmodule Api.Repo.Migrations.AddColorToPixel do
  use Ecto.Migration

  def change do
    alter table("pixels") do
      add :color, :integer, default: 1
    end
  end
end
