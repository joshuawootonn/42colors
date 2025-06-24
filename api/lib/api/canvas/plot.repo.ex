defmodule Api.Canvas.Plot.Repo do
  @moduledoc """
  The Plot context.
  """

  import Ecto.Query, warn: false
  import Geo.PostGIS
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
  Efficiently checks which points are within any of the user's plots using a single query.

  ## Parameters
  - `points`: List of %Geo.Point{} structs
  - `user_id`: The user ID to check plots for

  ## Returns
  - List of points that are within at least one of the user's plots

  ## Examples

      iex> points = [%Geo.Point{coordinates: {5, 5}, srid: 4326}]
      iex> points_within_plots(points, user_id)
      [%Geo.Point{coordinates: {5, 5}, srid: 4326}]

  """
  def points_within_plots(points, user_id) when is_list(points) and is_integer(user_id) do
    if Enum.empty?(points) do
      []
    else
      point_coords = Enum.map(points, fn %Geo.Point{coordinates: {x, y}} -> {x, y} end)

      sql = """
      SELECT DISTINCT
        coords.x,
        coords.y
      FROM unnest($1::float[], $2::float[]) as coords(x, y)
      WHERE EXISTS (
        SELECT 1 FROM plots
        WHERE user_id = $3
        AND polygon IS NOT NULL
        AND ST_Covers(polygon, ST_SetSRID(ST_MakePoint(coords.x, coords.y), 4326))
      )
      """

      x_coords = Enum.map(point_coords, &elem(&1, 0))
      y_coords = Enum.map(point_coords, &elem(&1, 1))

      result = Repo.query!(sql, [x_coords, y_coords, user_id])

      Enum.map(result.rows, fn [x, y] ->
        %Geo.Point{coordinates: {x, y}, srid: 4326}
      end)
    end
  end
end
