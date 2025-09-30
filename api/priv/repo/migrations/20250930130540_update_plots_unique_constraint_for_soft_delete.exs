defmodule Api.Repo.Migrations.UpdatePlotsUniqueConstraintForSoftDelete do
  use Ecto.Migration

  def up do
    # Drop the existing unique index
    drop_if_exists index(:plots, [:name, :user_id], name: :plots_name_user_id_index)

    # Create a partial unique index that only applies when deleted_at is NULL
    # This allows reusing plot names after soft deletion
    create unique_index(:plots, [:name, :user_id],
             name: :plots_name_user_id_deleted_at_null_index,
             where: "deleted_at IS NULL"
           )
  end

  def down do
    # Drop the partial index
    drop_if_exists index(:plots, [:name, :user_id],
                     name: :plots_name_user_id_deleted_at_null_index
                   )

    # Recreate the original unique index (this might fail if there are duplicate names)
    create unique_index(:plots, [:name, :user_id], name: :plots_name_user_id_index)
  end
end
