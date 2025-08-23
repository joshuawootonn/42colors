defmodule Api.Repo.Migrations.MakePixelsUserOptionalAndKeepFKs do
  use Ecto.Migration

  def up do
    # Drop existing foreign key constraints
    execute "ALTER TABLE pixels DROP CONSTRAINT IF EXISTS pixels_user_id_fkey"
    execute "ALTER TABLE pixels DROP CONSTRAINT IF EXISTS pixels_plot_id_fkey"

    # Relax NOT NULL on user_id and update FK to nilify on delete
    alter table(:pixels) do
      modify :user_id, references(:users, on_delete: :nilify_all), null: true
    end

    # Ensure plot_id remains nullable and update FK to nilify on delete
    alter table(:pixels) do
      modify :plot_id, references(:plots, on_delete: :nilify_all), null: true
    end
  end

  def down do
    # Revert to stricter constraint: user_id required
    execute "ALTER TABLE pixels DROP CONSTRAINT IF EXISTS pixels_user_id_fkey"

    alter table(:pixels) do
      modify :user_id, references(:users), null: false
    end
  end
end
