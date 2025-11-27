defmodule Api.Repo.Migrations.AddScoreToPlots do
  use Ecto.Migration

  def change do
    alter table(:plots) do
      add :score, :integer, default: 0, null: false
    end
  end
end
