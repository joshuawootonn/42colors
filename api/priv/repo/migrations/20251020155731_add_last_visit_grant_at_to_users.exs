defmodule Api.Repo.Migrations.AddLastVisitGrantAtToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :last_visit_grant_at, :utc_datetime
    end
  end
end
