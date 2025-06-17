defmodule Api.Plots do
  @moduledoc """
  The Plots context.
  """

  import Ecto.Query, warn: false
  alias Api.Repo

  alias Api.Plots.Plot

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
end
