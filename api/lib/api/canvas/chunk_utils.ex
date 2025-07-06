defmodule Api.Canvas.ChunkUtils do
  @moduledoc """
  Utilities for working with canvas chunks and calculating chunk boundaries.
  """

  @doc """
  Calculates the chunk key for given coordinates.
  """
  def get_chunk_key(x, y) when is_number(x) and is_number(y) do
    chunk_length = get_chunk_length()
    chunk_x = floor(x / chunk_length) * chunk_length
    chunk_y = floor(y / chunk_length) * chunk_length
    "x: #{chunk_x} y: #{chunk_y}"
  end

  @doc """
  Calculates the chunk origin coordinates for given coordinates.
  """
  def get_chunk_origin(x, y) when is_number(x) and is_number(y) do
    chunk_length = get_chunk_length()
    chunk_x = floor(x / chunk_length) * chunk_length
    chunk_y = floor(y / chunk_length) * chunk_length
    {chunk_x, chunk_y}
  end

  @doc """
  Calculates all chunk keys that a polygon intersects with.
  Returns a list of unique chunk keys.
  """
  def get_affected_chunk_keys(%Geo.Polygon{coordinates: [coordinates | _]}) do
    chunk_length = get_chunk_length()

    # Get all vertices from the polygon
    vertices = coordinates

    # Calculate bounding box
    {min_x, max_x} = vertices |> Enum.map(&elem(&1, 0)) |> Enum.min_max()
    {min_y, max_y} = vertices |> Enum.map(&elem(&1, 1)) |> Enum.min_max()

    # Calculate chunk ranges
    start_chunk_x = floor(min_x / chunk_length) * chunk_length
    end_chunk_x = floor(max_x / chunk_length) * chunk_length
    start_chunk_y = floor(min_y / chunk_length) * chunk_length
    end_chunk_y = floor(max_y / chunk_length) * chunk_length

    # Generate all chunk keys in the bounding box
    for chunk_x <- start_chunk_x..end_chunk_x//chunk_length,
        chunk_y <- start_chunk_y..end_chunk_y//chunk_length do
      get_chunk_key(chunk_x, chunk_y)
    end
    |> Enum.uniq()
  end

  def get_affected_chunk_keys(_), do: []

  @doc """
  Gets the chunk length from application config.
  """
  def chunk_length, do: get_chunk_length()

  # Gets the viewport diameter from config, which serves as our chunk length.
  defp get_chunk_length do
    Application.get_env(:api, Api.PixelCache)[:viewport_diameter] || 400
  end
end
