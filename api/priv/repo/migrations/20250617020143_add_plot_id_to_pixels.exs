defmodule Api.Repo.Migrations.AddPlotIdToPixels do
  use Ecto.Migration

  def change do
    alter table(:pixels) do
      add :plot_id, references(:plots, on_delete: :nilify_all)
    end

    create index(:pixels, [:plot_id])
  end
end
