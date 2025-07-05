defmodule Api.Canvas.Plot.Service do
  @moduledoc """
  Service module for plot operations with business logic.
  """

  alias Api.Canvas.Plot

  @chunk_size 400

  @doc """
  Lists plots within a 400x400 chunk based on the given x,y coordinates.

  The chunk is calculated by centering a 400x400 square around the given coordinates,
  then finding all plots that intersect with this area.

  ## Parameters
  - `x`: X coordinate (integer, center of the chunk)
  - `y`: Y coordinate (integer, center of the chunk)

  ## Returns
  - List of %Plot{} structs that intersect with the chunk area

  ## Examples

      iex> Plot.Service.list_plots_by_chunk(100, 100)
      [%Plot{}, ...]

      iex> Plot.Service.list_plots_by_chunk(0, 0)
      []

  ## Note
  This function only accepts integer coordinates. String parsing and validation
  should be handled at the controller layer.
  """
  def list_plots_by_chunk(x, y) when is_integer(x) and is_integer(y) do
    # Calculate chunk boundaries (400x400 centered on x,y)
    min_x = x
    max_x = x + @chunk_size
    min_y = y
    max_y = y + @chunk_size

    # Create a polygon representing the chunk area
    chunk_polygon = %Geo.Polygon{
      coordinates: [[
        {min_x, min_y},
        {min_x, max_y},
        {max_x, max_y},
        {max_x, min_y},
        {min_x, min_y}
      ]],
      srid: 4326
    }

    Plot.Repo.list_plots_within_polygon(chunk_polygon)
  end

  @doc """
  Returns the chunk size used for spatial queries.
  """
  def chunk_size, do: @chunk_size
end
