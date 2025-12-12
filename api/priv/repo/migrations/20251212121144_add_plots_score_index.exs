defmodule Api.Repo.Migrations.AddPlotsScoreIndex do
  use Ecto.Migration

  def change do
    create index(:plots, ["score DESC", "inserted_at DESC"],
             where: "deleted_at IS NULL",
             name: :plots_top_score_index
           )
  end
end
