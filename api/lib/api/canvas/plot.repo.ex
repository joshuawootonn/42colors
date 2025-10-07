defmodule Api.Canvas.Plot.Repo do
  @moduledoc """
  The Plot context.
  """

  import Ecto.Query, warn: false
  alias Api.Repo

  alias Api.Canvas.Plot

  @doc """
  Returns the list of plots for a user.

  ## Examples

      iex> list_user_plots(user_id)
      [%Plot{}, ...]

  """
  def list_user_plots(user_id) do
    Plot
    |> where([p], p.user_id == ^user_id)
    |> where([p], is_nil(p.deleted_at))
    |> Repo.all()
  end

  @doc """
  Gets a single plot.

  Raises `Ecto.NoResultsError` if the Plot does not exist.

  ## Examples

      iex> get_plot!(123)
      %Plot{}

      iex> get_plot!(456)
      ** (Ecto.NoResultsError)

  """
  def get_plot!(id) do
    Plot
    |> where([p], p.id == ^id)
    |> where([p], is_nil(p.deleted_at))
    |> Repo.one!()
  end

  @doc """
  Gets a single plot for a specific user.

  Returns nil if the Plot does not exist or doesn't belong to the user.

  ## Examples

      iex> get_user_plot!(123, user_id)
      %Plot{}

      iex> get_user_plot!(456, user_id)
      nil

  """
  def get_user_plot!(id, user_id) do
    Plot
    |> where([p], p.id == ^id and p.user_id == ^user_id)
    |> where([p], is_nil(p.deleted_at))
    |> Repo.one()
  end

  @doc """
  Creates a plot.

  ## Examples

      iex> create_plot(%{field: value})
      {:ok, %Plot{}}

      iex> create_plot(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_plot(attrs \\ %{}) do
    %Plot{}
    |> Plot.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a plot.

  ## Examples

      iex> update_plot(plot, %{field: new_value})
      {:ok, %Plot{}}

      iex> update_plot(plot, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_plot(%Plot{} = plot, attrs) do
    plot
    |> Plot.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a plot.

  ## Examples

      iex> delete_plot(plot)
      {:ok, %Plot{}}

      iex> delete_plot(plot)
      {:error, %Ecto.Changeset{}}

  """
  def delete_plot(%Plot{} = plot) do
    plot
    |> Plot.changeset(%{deleted_at: DateTime.utc_now()})
    |> Repo.update()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking plot changes.

  ## Examples

      iex> change_plot(plot)
      %Ecto.Changeset{data: %Plot{}}

  """
  def change_plot(%Plot{} = plot, attrs \\ %{}) do
    Plot.changeset(plot, attrs)
  end

  @doc """
  Lists plots with configurable options.

  ## Options
  - `limit`: Maximum number of plots to return (default: 10, max: 100)
  - Future options will include user_id filtering, different sort orders, etc.

  ## Returns
  - List of %Plot{} structs sorted by creation date (newest first)

  ## Examples

      iex> list_plots(%{})
      [%Plot{}, ...]

      iex> list_plots(%{limit: 5})
      [%Plot{}, ...]

  """
  def list_plots(opts \\ %{}) do
    limit = get_list_limit(opts)

    Plot
    |> where([p], is_nil(p.deleted_at))
    |> order_by([p], desc: p.inserted_at)
    |> limit(^limit)
    |> Repo.all()
  end

  # Private function to handle limit validation
  defp get_list_limit(%{limit: limit}) when is_integer(limit) and limit > 0 do
    # Cap at maximum of 100
    min(limit, 100)
  end

  defp get_list_limit(%{limit: 0}), do: 0

  # Default limit
  defp get_list_limit(_), do: 10

  @doc """
  For a list of points, returns a map from {x, y} to the covering plot's id and owner user_id.

  If a point is not covered by any plot, it will not be present in the map.
  When multiple plots would cover a point, the query selects an arbitrary one
  (plots are expected to not overlap by policy).
  """
  def plots_covering_points(points) when is_list(points) do
    if Enum.empty?(points) do
      %{}
    else
      point_coords = Enum.map(points, fn %Geo.Point{coordinates: {x, y}} -> {x, y} end)

      sql = """
      SELECT DISTINCT ON (coords.x, coords.y)
        coords.x,
        coords.y,
        p.id as plot_id,
        p.user_id
      FROM unnest($1::float[], $2::float[]) as coords(x, y)
      JOIN plots p ON p.polygon IS NOT NULL
        AND p.deleted_at IS NULL
        AND ST_Covers(p.polygon, ST_SetSRID(ST_MakePoint(coords.x, coords.y), 4326))
      ORDER BY coords.x, coords.y, p.id
      """

      x_coords = Enum.map(point_coords, &elem(&1, 0))
      y_coords = Enum.map(point_coords, &elem(&1, 1))

      result = Repo.query!(sql, [x_coords, y_coords])

      Enum.reduce(result.rows, %{}, fn [x, y, plot_id, user_id], acc ->
        Map.put(acc, {trunc(x), trunc(y)}, %{plot_id: plot_id, user_id: user_id})
      end)
    end
  end

  @doc """
  Returns all plots that are within or intersect with the given polygon.

  ## Parameters
  - `polygon`: A %Geo.Polygon{} struct representing the search area

  ## Returns
  - List of %Plot{} structs that are within or intersect with the polygon

  ## Examples

      iex> polygon = %Geo.Polygon{coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]], srid: 4326}
      iex> list_plots_intersecting_polygon(polygon)
      [%Plot{}, ...]

  """
  def list_plots_intersecting_polygon(%Geo.Polygon{} = polygon) do
    Plot
    |> where([p], not is_nil(p.polygon))
    |> where([p], is_nil(p.deleted_at))
    |> where([p], fragment("ST_Intersects(?, ?)", p.polygon, ^polygon))
    |> Repo.all()
  end

  def list_plots_intersecting_polygon(_), do: {:error, :invalid_polygon}

  @doc """
  Calculates the size (pixel count) of a polygon.

  Uses PostGIS ST_Area to calculate the area of the polygon,
  which represents the number of pixels within the polygon.

  ## Parameters
  - `polygon`: A %Geo.Polygon{} struct

  ## Returns
  - Integer representing the number of pixels (area) in the polygon
  - 0 if polygon is nil or invalid

  ## Examples

      iex> polygon = %Geo.Polygon{coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]], srid: 4326}
      iex> Plot.Repo.get_size(polygon)
      100
  """
  def get_size(%Geo.Polygon{} = polygon) do
    # Use PostGIS ST_Area to calculate the area of the polygon
    # Since our coordinate system represents pixels directly, the area equals pixel count
    sql = "SELECT ST_Area($1::geometry) as area"

    case Repo.query(sql, [polygon]) do
      {:ok, %{rows: [[area]]}} when is_number(area) ->
        # Round to nearest integer since we're dealing with pixel counts
        round(area)

      _ ->
        0
    end
  end

  def get_size(_), do: 0
end
