defmodule Api.Canvas.PixelService do
  @moduledoc """
  Service module for pixel operations with business logic validation.
  """

  alias Api.Canvas.{Pixel, Plot}

  @doc """
  Creates many pixels after validating they are within one of the user's plots.
  Supports partial acceptance - valid pixels are created, invalid ones are reported.

  ## Parameters
  - `pixels`: List of pixel attributes maps with :x, :y, :color keys
  - `user_id`: The ID of the user creating the pixels

  ## Returns
  - `{:ok, created_pixels}` if all pixels are valid and within user plots
  - `{:ok, created_pixels, invalid_pixels}` if some pixels are valid (partial success)
  - `{:error, :no_plots}` if user has no plots
  - `{:error, :all_invalid, invalid_pixels}` if no pixels are within plots
  - `{:error, changeset}` if there are validation errors during creation

  ## Examples

      iex> PixelService.create_many([%{x: 5, y: 5, color: 1}], user_id)
      {:ok, [%Pixel{}]}

      iex> PixelService.create_many([%{x: 5, y: 5, color: 1}, %{x: 999, y: 999, color: 2}], user_id)
      {:ok, [%Pixel{}], [%{x: 999, y: 999, color: 2}]}

  """
  def create_many(pixels, user_id) when is_list(pixels) and is_integer(user_id) do
    # Check if user has any plots
    user_plots = Plot.Repo.list_user_plots(user_id)

    if Enum.empty?(user_plots) do
      {:error, :no_plots}
    else
      # Separate valid and invalid pixels using efficient batch validation
      {valid_pixels, invalid_pixels} = validate_pixels_within_plots(pixels, user_id)

      cond do
        # All pixels are invalid
        Enum.empty?(valid_pixels) ->
          {:error, :all_invalid, invalid_pixels}

        # Some or all pixels are valid - create the valid ones
        true ->
          pixel_attrs = Enum.map(valid_pixels, &Map.put(&1, :user_id, user_id))

          case Pixel.Repo.create_many_pixels(pixel_attrs) do
            {:ok, created_pixels} ->
              if Enum.empty?(invalid_pixels) do
                {:ok, created_pixels}
              else
                {:ok, created_pixels, invalid_pixels}
              end

            {:error, changeset} ->
              {:error, changeset}
          end
      end
    end
  end

  def create_many(_, _), do: {:error, :invalid_arguments}

  defp validate_pixels_within_plots(pixels, user_id) do
    points = Enum.map(pixels, fn pixel -> create_point(pixel.x, pixel.y) end)

    valid_points = Plot.Repo.points_within_plots(points, user_id)

    valid_point_set =
      MapSet.new(valid_points, fn %Geo.Point{coordinates: {x, y}} ->
        {trunc(x), trunc(y)}
      end)

    Enum.split_with(pixels, fn pixel ->
      MapSet.member?(valid_point_set, {pixel.x, pixel.y})
    end)
  end

  # Creates a PostGIS point from x, y coordinates.
  defp create_point(x, y) do
    %Geo.Point{coordinates: {x, y}, srid: 4326}
  end
end
