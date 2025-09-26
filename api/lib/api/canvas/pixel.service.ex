defmodule Api.Canvas.PixelService do
  @moduledoc """
  Service module for pixel operations with business logic validation.
  """

  alias Api.Canvas.{Pixel, Plot}

  @doc """
  Creates many pixels with new rules:
  - Pixels are saved by default for anyone (even unauthenticated users)
  - If a pixel falls inside a plot owned by someone else, it is rejected
  - If a pixel falls inside the current user's own plot, it is accepted and associated to that plot
  - Pixels outside all plots are accepted and saved with no plot association

  `user_id` can be nil (unauthenticated). In that case, pixels are accepted unless they fall inside any plot.
  """
  def create_many(pixels, user_id)
      when is_list(pixels) and (is_integer(user_id) or is_nil(user_id)) do
    # Build point list and determine covering plots for each point
    points = Enum.map(pixels, fn pixel -> create_point(pixel.x, pixel.y) end)
    point_to_plot = Plot.Repo.plots_covering_points(points)

    # Split pixels and collect plot info for rejected pixels
    {accepted, rejected_with_plots} =
      pixels
      |> Enum.map(fn pixel ->
        plot_info = Map.get(point_to_plot, {pixel.x, pixel.y})
        {pixel, plot_info}
      end)
      |> Enum.split_with(fn {_pixel, plot_info} ->
        case plot_info do
          nil ->
            # Not inside any plot: accept
            true

          %{user_id: plot_owner_id} ->
            cond do
              is_nil(user_id) -> false
              plot_owner_id == user_id -> true
              true -> false
            end
        end
      end)

    # Extract just the pixels from accepted tuples
    accepted = Enum.map(accepted, fn {pixel, _plot_info} -> pixel end)

    # Extract rejected pixels and their plot IDs
    rejected = Enum.map(rejected_with_plots, fn {pixel, _plot_info} -> pixel end)

    rejected_plot_ids =
      rejected_with_plots
      |> Enum.map(fn {_pixel, plot_info} ->
        case plot_info do
          %{plot_id: plot_id} -> plot_id
          _ -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Enum.uniq()

    if Enum.empty?(accepted) do
      {:error, :all_invalid, rejected, rejected_plot_ids}
    else
      # Attach user_id when present and plot_id when the accepted pixel is inside the user's own plot
      accepted_attrs =
        Enum.map(accepted, fn pixel ->
          base = %{x: pixel.x, y: pixel.y, color: pixel.color}
          base = if is_integer(user_id), do: Map.put(base, :user_id, user_id), else: base

          case Map.get(point_to_plot, {pixel.x, pixel.y}) do
            %{plot_id: plot_id, user_id: ^user_id} when is_integer(user_id) ->
              Map.put(base, :plot_id, plot_id)

            _ ->
              base
          end
        end)

      case Pixel.Repo.create_many_pixels(accepted_attrs) do
        {:ok, created_pixels} ->
          if Enum.empty?(rejected) do
            {:ok, created_pixels}
          else
            {:ok, created_pixels, rejected, rejected_plot_ids}
          end

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  def create_many(_, _), do: {:error, :invalid_arguments}

  # Creates a PostGIS point from x, y coordinates.
  defp create_point(x, y) do
    %Geo.Point{coordinates: {x, y}, srid: 4326}
  end
end
