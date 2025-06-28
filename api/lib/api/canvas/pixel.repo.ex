defmodule Api.Canvas.Pixel.Repo do
  @moduledoc """
  The Canvas context.
  """

  import Ecto.Query, warn: false
  alias Api.Repo

  alias Api.Canvas.Pixel

  @doc """
  Returns the list of pixels.

  ## Examples

      iex> list_pixels()
      [%Pixel{}, ...]

  """
  def list_pixels do
    Repo.all(Pixel)
  end

  @doc """
  Gets a single pixel.

  Raises `Ecto.NoResultsError` if the Pixel does not exist.

  ## Examples

      iex> get_pixel!(123)
      %Pixel{}

      iex> get_pixel!(456)
      ** (Ecto.NoResultsError)

  """
  def get_pixel!(id), do: Repo.get!(Pixel, id)

  @doc """
  Creates a pixel.

  ## Examples

      iex> create_pixel(%{field: value})
      {:ok, %Pixel{}}

      iex> create_pixel(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_pixel(attrs \\ %{}) do
    %Pixel{}
    |> Pixel.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates many pixels using a single bulk INSERT query.

  ## Examples

      iex> create_many_pixels([%{x: 1, y: 1, color: 1, user_id: 1}])
      {:ok, [%Pixel{}, ...]}

      iex> create_many_pixels([%{x: 1, y: 1}])  # missing required fields
      {:error, %Ecto.Changeset{}}

  """
  def create_many_pixels(attrs_list) when is_list(attrs_list) do
    changesets = Enum.map(attrs_list, fn attr ->
      %Pixel{} |> Pixel.changeset(attr)
    end)

    case Enum.find(changesets, fn changeset -> not changeset.valid? end) do
            nil ->
        # insert_all doesn't auto-generate timestamps
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        insert_data = Enum.map(changesets, fn changeset ->
          changes = changeset.changes
          %{
            x: changes.x,
            y: changes.y,
            color: changes.color,
            user_id: changes.user_id,
            plot_id: Map.get(changes, :plot_id),
            inserted_at: now,
            updated_at: now
          }
        end)

        # Use insert_all for bulk insert - this generates a single INSERT statement
        {count, pixels} = Repo.insert_all(Pixel, insert_data, returning: true)

        if count == length(attrs_list) do
          {:ok, pixels}
        else
          {:error, "Partial insert failure"}
        end


      invalid_changeset ->
        {:error, invalid_changeset}
    end
  end

  def create_many_pixels(_), do: {:error, :invalid_arguments}

  @doc """
  Updates a pixel.

  ## Examples

      iex> update_pixel(pixel, %{field: new_value})
      {:ok, %Pixel{}}

      iex> update_pixel(pixel, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_pixel(%Pixel{} = pixel, attrs) do
    pixel
    |> Pixel.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a pixel.

  ## Examples

      iex> delete_pixel(pixel)
      {:ok, %Pixel{}}

      iex> delete_pixel(pixel)
      {:error, %Ecto.Changeset{}}

  """
  def delete_pixel(%Pixel{} = pixel) do
    Repo.delete(pixel)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking pixel changes.

  ## Examples

      iex> change_pixel(pixel)
      %Ecto.Changeset{data: %Pixel{}}

  """
  def change_pixel(%Pixel{} = pixel, attrs \\ %{}) do
    Pixel.changeset(pixel, attrs)
  end
end
