defmodule Api.Repo.Migrations.AddGeometryToPlots do
  use Ecto.Migration

  def up do
    # Enable PostGIS extension
    execute "CREATE EXTENSION IF NOT EXISTS postgis"

    # Add polygon column to plots table
    execute "ALTER TABLE plots ADD COLUMN polygon geometry(Polygon, 4326)"

    # Create spatial index for better query performance
    execute "CREATE INDEX plots_polygon_idx ON plots USING GIST (polygon)"
  end

  def down do
    # Drop the spatial index
    execute "DROP INDEX IF EXISTS plots_polygon_idx"

    # Remove the polygon column
    execute "ALTER TABLE plots DROP COLUMN polygon"

    # Note: We don't drop the PostGIS extension as it might be used by other tables
  end
end
