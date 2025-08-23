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
  def get_plot!(id), do: Repo.get!(Plot, id)

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
    Repo.delete(plot)
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
      iex> list_plots_within_polygon(polygon)
      [%Plot{}, ...]

  """
  def list_plots_within_polygon(%Geo.Polygon{} = polygon) do
    Plot
    |> where([p], not is_nil(p.polygon))
    |> where([p], fragment("ST_Intersects(?, ?)", p.polygon, ^polygon))
    |> Repo.all()
  end

  def list_plots_within_polygon(_), do: {:error, :invalid_polygon}
end
