defmodule Api.Repo.Migrations.AddPixelsChunkIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    # Composite index for chunk-based pixel queries.
    # Supports: WHERE x >= $1 AND x <= $2 AND y >= $3 AND y <= $4
    #           ORDER BY x, y, inserted_at DESC, id DESC
    #           DISTINCT ON (x, y)
    #
    # Using CONCURRENTLY to avoid locking the table during index creation.
    create index(:pixels, [:x, :y, "inserted_at DESC", "id DESC"],
             name: :pixels_chunk_lookup_index,
             concurrently: true
           )
  end
end
