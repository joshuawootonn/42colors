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
      # Broad phase: find candidate polygons that touch or contain each point,
      # then classify in Elixir with an integer-lattice winding predicate.
      point_coords = Enum.map(points, fn %Geo.Point{coordinates: {x, y}} -> {x, y} end)

      # Use raw SQL with Ecto to get Geo.Polygon structs directly
      x_coords = Enum.map(point_coords, &elem(&1, 0))
      y_coords = Enum.map(point_coords, &elem(&1, 1))

      sql = """
      SELECT
        coords.x,
        coords.y,
        p.id as plot_id,
        p.user_id,
        p.polygon
      FROM unnest($1::float[], $2::float[]) as coords(x, y)
      JOIN plots p ON p.polygon IS NOT NULL
        AND p.deleted_at IS NULL
        AND ST_Intersects(p.polygon, ST_SetSRID(ST_MakePoint(coords.x, coords.y), 4326))
      """

      result = Repo.query!(sql, [x_coords, y_coords], [])

      candidates =
        Enum.map(result.rows, fn [x, y, plot_id, user_id, polygon] ->
          %{
            x: x,
            y: y,
            plot_id: plot_id,
            user_id: user_id,
            polygon: polygon
          }
        end)

      candidates_by_point =
        Enum.group_by(candidates, fn %{x: x, y: y} ->
          {trunc(x), trunc(y)}
        end)

      Enum.reduce(point_coords, %{}, fn {x, y}, acc ->
        case Map.get(candidates_by_point, {x, y}, []) do
          [] ->
            acc

          candidate_structs ->
            case find_covering_plot_winding(x, y, candidate_structs) do
              nil ->
                acc

              %{plot_id: plot_id, user_id: user_id} ->
                Map.put(acc, {x, y}, %{plot_id: plot_id, user_id: user_id})
            end
        end
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

  # ==== Integer-lattice winding predicate (half-open boundaries) ====
  # Choose a covering candidate for a point using winding number classification.
  defp find_covering_plot_winding(x, y, candidates) do
    Enum.find_value(candidates, fn %{plot_id: plot_id, user_id: user_id, polygon: polygon} ->
      rings = remove_matching_endpoint(polygon)

      if point_in_polygon_winding_half_open?(x, y, rings) do
        %{plot_id: plot_id, user_id: user_id}
      else
        nil
      end
    end)
  end

  # Extract rings from a Geo.Polygon struct
  # PostGIS polygons are always closed, so we always drop the last coordinate
  defp remove_matching_endpoint(%Geo.Polygon{coordinates: coordinates}) do
    Enum.map(coordinates, fn ring ->
      case ring do
        [] -> []
        coords -> Enum.drop(coords, -1)
      end
    end)
  end

  # Point-in-polygon with nonzero winding rule and half-open tie-breaking on the
  # integer lattice. Horizontal edges are excluded from winding; upward edges use
  # y in [y1, y2), downward edges use y in [y2, y1).
  defp point_in_polygon_winding_half_open?(px, py, rings) do
    # On-edge handling first
    case on_boundary_half_open?(px, py, rings) do
      :inside ->
        true

      :outside ->
        false

      :not_on_boundary ->
        winding =
          Enum.reduce(rings, 0, fn ring, acc ->
            acc + winding_for_ring(px, py, ring)
          end)

        winding != 0
    end
  end

  defp winding_for_ring(px, py, vertices) do
    vertices
    |> Enum.chunk_every(2, 1, [List.first(vertices)])
    |> Enum.reduce(0, fn [{x1, y1}, {x2, y2}], wn ->
      cond do
        # ignore horizontal in winding
        y1 == y2 -> wn
        y1 <= py and y2 > py and is_left(px, py, x1, y1, x2, y2) > 0 -> wn + 1
        y1 > py and y2 <= py and is_left(px, py, x1, y1, x2, y2) < 0 -> wn - 1
        true -> wn
      end
    end)
  end

  # Cross product sign: >0 means point is left of edge (x1,y1)->(x2,y2)
  defp is_left(px, py, x1, y1, x2, y2) do
    (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1)
  end

  # Boundary handling with half-open rule: include points on top or left
  # axis-aligned edges; include points on slanted edges to avoid gaps; exclude
  # points on bottom or right axis-aligned edges.
  defp on_boundary_half_open?(px, py, rings) do
    Enum.find_value(rings, :not_on_boundary, fn vertices ->
      edges = Enum.chunk_every(vertices, 2, 1, [List.first(vertices)])

      Enum.find_value(edges, :not_on_boundary, fn [{x1, y1}, {x2, y2}] ->
        if collinear_and_between?(px, py, x1, y1, x2, y2) do
          # Check if this edge is on the exterior boundary of the polygon
          if is_exterior_boundary_edge?(x1, y1, x2, y2, vertices) do
            cond do
              # Horizontal edge: include only top edges; exclude bottom edges
              y1 == y2 ->
                # Check if this is the minimum y coordinate (top edge in screen coords)
                min_y = Enum.min_by(vertices, fn {_, y} -> y end) |> elem(1)

                if py == y1 and y1 == min_y and px >= min(x1, x2) and px < max(x1, x2),
                  do: :inside,
                  else: :outside

              # Vertical edge: include only left edges; exclude right edges
              x1 == x2 ->
                # Check if this is the minimum x coordinate (left edge)
                min_x = Enum.min_by(vertices, fn {x, _} -> x end) |> elem(0)

                if px == x1 and x1 == min_x and py >= min(y1, y2) and py < max(y1, y2),
                  do: :inside,
                  else: :outside

              # Slanted edges: treat as inside to avoid gaps
              true ->
                :inside
            end
          else
            # Interior edge - don't apply boundary rules, let winding handle it
            :not_on_boundary
          end
        else
          nil
        end
      end) || :not_on_boundary
    end)
  end

  # Check if an edge is on the exterior boundary by seeing if it's on the bounding box
  # For simple polygons, exterior edges have the polygon interior on one side only
  defp is_exterior_boundary_edge?(x1, y1, x2, y2, vertices) do
    # Get the bounding box
    {min_x, max_x, min_y, max_y} = get_bounding_box(vertices)

    # An edge is exterior if it lies on the bounding box boundary
    cond do
      # Top edge
      y1 == y2 and y1 == min_y -> true
      # Bottom edge
      y1 == y2 and y1 == max_y -> true
      # Left edge
      x1 == x2 and x1 == min_x -> true
      # Right edge
      x1 == x2 and x1 == max_x -> true
      # Not on bounding box boundary
      true -> false
    end
  end

  # Get bounding box of polygon vertices
  defp get_bounding_box(vertices) do
    {xs, ys} = Enum.unzip(vertices)
    {Enum.min(xs), Enum.max(xs), Enum.min(ys), Enum.max(ys)}
  end

  defp collinear_and_between?(px, py, x1, y1, x2, y2) do
    cross = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1)

    if abs(cross) > 0.0 do
      false
    else
      px >= min(x1, x2) and px <= max(x1, x2) and py >= min(y1, y2) and py <= max(y1, y2)
    end
  end

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
