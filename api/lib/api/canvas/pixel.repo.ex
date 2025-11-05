defmodule Api.Canvas.Pixel.Repo do
  @moduledoc """
  The Canvas context.
  """

  import Ecto.Query, warn: false
  alias Api.Repo

  alias Api.Canvas.Pixel

  # PostgreSQL limit is 65535 parameters. Each pixel has 7 fields,
  # so we can safely insert ~9,362 pixels per batch. Using 9,000 for safety margin.
  @batch_size 9_000

  @doc """
  Returns the list of pixels.

  ## Examples

      iex> list_pixels()
      [%Pixel{}, ...]

  """
  def list_pixels do
    Pixel
    |> order_by([p], asc: p.inserted_at)
    |> Repo.all()
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
  Creates many pixels using bulk INSERT queries. Large batches are automatically
  split into smaller batches to avoid PostgreSQL's parameter limit (65535).

  ## Examples

      iex> create_many_pixels([%{x: 1, y: 1, color_ref: 1, user_id: 1}])
      {:ok, [%Pixel{}, ...]}

      iex> create_many_pixels([%{x: 1, y: 1}])  # missing required fields
      {:error, %Ecto.Changeset{}}

  """
  def create_many_pixels(attrs_list) when is_list(attrs_list) do
    changesets =
      Enum.map(attrs_list, fn attr ->
        %Pixel{} |> Pixel.changeset(attr)
      end)

    case Enum.find(changesets, fn changeset -> not changeset.valid? end) do
      nil ->
        # insert_all doesn't auto-generate timestamps
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        insert_data =
          Enum.map(changesets, fn changeset ->
            changes = changeset.changes

            %{
              x: changes.x,
              y: changes.y,
              color_ref: changes.color_ref,
              user_id: Map.get(changes, :user_id),
              plot_id: Map.get(changes, :plot_id),
              inserted_at: now,
              updated_at: now
            }
          end)

        # Split into batches if needed to avoid PostgreSQL parameter limit
        insert_data
        |> Enum.chunk_every(@batch_size)
        |> Enum.reduce_while({:ok, []}, fn batch, {:ok, acc_pixels} ->
          {count, pixels} = Repo.insert_all(Pixel, batch, returning: true)

          if count == length(batch) do
            {:cont, {:ok, acc_pixels ++ pixels}}
          else
            {:halt, {:error, "Partial insert failure in batch"}}
          end
        end)

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
