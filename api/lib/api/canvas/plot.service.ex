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
      coordinates: [
        [
          {min_x, min_y},
          {min_x, max_y},
          {max_x, max_y},
          {max_x, min_y},
          {min_x, min_y}
        ]
      ],
      srid: 4326
    }

    Plot.Repo.list_plots_within_polygon(chunk_polygon)
  end

  @doc """
  Creates a plot with overlap validation.

  Validates that the new plot doesn't overlap with any existing plots
  before creating it.

  ## Parameters
  - `attrs`: Map of plot attributes including polygon

  ## Returns
  - `{:ok, %Plot{}}` if creation is successful
  - `{:error, :overlapping_plots, overlapping_plots}` if plot overlaps with existing plots
  - `{:error, %Ecto.Changeset{}}` if there are validation errors

  ## Examples

      iex> Plot.Service.create_plot(%{name: "Test", user_id: 1, polygon: polygon})
      {:ok, %Plot{}}

      iex> Plot.Service.create_plot(%{name: "Overlapping", user_id: 1, polygon: overlapping_polygon})
      {:error, :overlapping_plots, [%Plot{}]}

  """
  def create_plot(attrs) do
    case Map.get(attrs, "polygon") || Map.get(attrs, :polygon) do
      nil ->
        # If no polygon provided, proceed with normal validation (will fail in changeset)
        Plot.Repo.create_plot(attrs)

      polygon ->
        case check_for_overlaps(polygon, nil) do
          [] ->
            # No overlaps, proceed with creation
            Plot.Repo.create_plot(attrs)

          overlapping_plots ->
            # Found overlaps, return error with details
            {:error, :overlapping_plots, overlapping_plots}
        end
    end
  end

  @doc """
  Updates a plot with overlap validation.

  Validates that the updated plot doesn't overlap with any existing plots
  (excluding itself) before updating it.

  ## Parameters
  - `plot`: The existing %Plot{} struct to update
  - `attrs`: Map of plot attributes to update

  ## Returns
  - `{:ok, %Plot{}}` if update is successful
  - `{:error, :overlapping_plots, overlapping_plots}` if plot overlaps with existing plots
  - `{:error, %Ecto.Changeset{}}` if there are validation errors

  ## Examples

      iex> Plot.Service.update_plot(plot, %{name: "Updated"})
      {:ok, %Plot{}}

      iex> Plot.Service.update_plot(plot, %{polygon: overlapping_polygon})
      {:error, :overlapping_plots, [%Plot{}]}

  """
  def update_plot(%Plot{} = plot, attrs) do
    # Check if polygon is being updated
    new_polygon = Map.get(attrs, "polygon") || Map.get(attrs, :polygon)

    case new_polygon do
      nil ->
        # No polygon update, proceed with normal update
        Plot.Repo.update_plot(plot, attrs)

      polygon ->
        case check_for_overlaps(polygon, plot.id) do
          [] ->
            # No overlaps, proceed with update
            Plot.Repo.update_plot(plot, attrs)

          overlapping_plots ->
            # Found overlaps, return error with details
            {:error, :overlapping_plots, overlapping_plots}
        end
    end
  end

  @doc """
  Returns the chunk size used for spatial queries.
  """
  def chunk_size, do: @chunk_size

  # Private function to check for overlapping plots
  defp check_for_overlaps(polygon, exclude_plot_id) do
    overlapping_plots = Plot.Repo.list_plots_within_polygon(polygon)

    case exclude_plot_id do
      nil ->
        # Creating new plot, check against all existing plots
        overlapping_plots

      plot_id ->
        # Updating existing plot, exclude itself from overlap check
        Enum.filter(overlapping_plots, fn plot -> plot.id != plot_id end)
    end
  end
end
