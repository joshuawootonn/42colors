defmodule Api.Repo.Migrations.RenameColorToColorRefInPixels do
  use Ecto.Migration

  def change do
    rename table(:pixels), :color, to: :color_ref
  end
end
