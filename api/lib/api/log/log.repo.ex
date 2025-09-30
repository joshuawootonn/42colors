defmodule Api.Logs.Log.Repo do
  @moduledoc """
  Repository for Log CRUD operations.
  """

  import Ecto.Query, warn: false
  alias Api.Repo
  alias Api.Logs.Log

  @doc """
  Gets a single log by ID.

  Returns nil if the log does not exist.

  ## Examples

      iex> get(123)
      %Log{}

      iex> get(456)
      nil

  """
  def get(id) do
    Repo.get(Log, id)
  end

  @doc """
  Gets a single log by ID, raising if not found.

  ## Examples

      iex> get!(123)
      %Log{}

      iex> get!(456)
      ** (Ecto.NoResultsError)

  """
  def get!(id) do
    Repo.get!(Log, id)
  end

  @doc """
  Lists all logs with optional filters and preloads.

  ## Options

    * `:user_id` - Filter by user_id
    * `:plot_id` - Filter by plot_id
    * `:log_type` - Filter by log_type
    * `:limit` - Limit number of results (default: 50)
    * `:offset` - Offset for pagination
    * `:order_by` - Field to order by (default: :inserted_at)
    * `:order_dir` - Order direction :asc or :desc (default: :desc)
    * `:preload` - List of associations to preload (e.g., [:plot, :voter])

  ## Examples

      iex> list()
      [%Log{}, ...]

      iex> list(user_id: 1, limit: 10)
      [%Log{}, ...]

      iex> list(log_type: "plot_created", preload: [:plot])
      [%Log{}, ...]

  """
  def list(opts \\ []) do
    Log
    |> apply_filters(opts)
    |> apply_ordering(opts)
    |> apply_pagination(opts)
    |> apply_preloads(opts)
    |> Repo.all()
  end

  @doc """
  Lists logs for a specific user.

  ## Options

    * `:limit` - Limit number of results (default: 50)
    * `:offset` - Offset for pagination
    * `:preload` - List of associations to preload

  ## Examples

      iex> list_by_user(1)
      [%Log{}, ...]

      iex> list_by_user(1, limit: 10, preload: [:plot])
      [%Log{}, ...]

  """
  def list_by_user(user_id, opts \\ []) do
    opts_with_user = Keyword.put(opts, :user_id, user_id)
    list(opts_with_user)
  end

  @doc """
  Lists logs for a specific plot.

  ## Options

    * `:limit` - Limit number of results
    * `:preload` - List of associations to preload

  ## Examples

      iex> list_by_plot(1)
      [%Log{}, ...]

  """
  def list_by_plot(plot_id, opts \\ []) do
    opts_with_plot = Keyword.put(opts, :plot_id, plot_id)
    list(opts_with_plot)
  end

  @doc """
  Creates a log.

  ## Examples

      iex> create(%{user_id: 1, amount: 100, log_type: "plot_created"})
      {:ok, %Log{}}

      iex> create(%{amount: 100})
      {:error, %Ecto.Changeset{}}

  """
  def create(attrs) do
    %Log{}
    |> Log.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates a log, raising on error.

  ## Examples

      iex> create!(%{user_id: 1, amount: 100, log_type: "plot_created"})
      %Log{}

      iex> create!(%{amount: 100})
      ** (Ecto.InvalidChangesetError)

  """
  def create!(attrs) do
    %Log{}
    |> Log.changeset(attrs)
    |> Repo.insert!()
  end

  @doc """
  Updates a log.

  Note: In most cases, logs should be immutable.
  This is provided for completeness but should be used with caution.

  ## Examples

      iex> update(log, %{metadata: %{updated: true}})
      {:ok, %Log{}}

      iex> update(log, %{amount: nil})
      {:error, %Ecto.Changeset{}}

  """
  def update(%Log{} = log, attrs) do
    log
    |> Log.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a log.

  Note: In most cases, logs should not be deleted.
  This is provided for completeness but should be used with extreme caution.

  ## Examples

      iex> delete(log)
      {:ok, %Log{}}

      iex> delete(log)
      {:error, %Ecto.Changeset{}}

  """
  def delete(%Log{} = log) do
    Repo.delete(log)
  end

  @doc """
  Calculates the sum of log amounts for a user.

  ## Examples

      iex> sum_by_user(1)
      100

      iex> sum_by_user(999)
      0

  """
  def sum_by_user(user_id) do
    Log
    |> where([t], t.user_id == ^user_id)
    |> select([t], sum(t.amount))
    |> Repo.one()
    |> case do
      nil -> 0
      sum -> sum
    end
  end

  @doc """
  Counts logs with optional filters.

  ## Options

    * `:user_id` - Filter by user_id
    * `:plot_id` - Filter by plot_id
    * `:log_type` - Filter by log_type

  ## Examples

      iex> count()
      42

      iex> count(user_id: 1)
      10

  """
  def count(opts \\ []) do
    Log
    |> apply_filters(opts)
    |> Repo.aggregate(:count)
  end

  # Private helper functions

  defp apply_filters(query, opts) do
    query
    |> filter_by_user_id(opts[:user_id])
    |> filter_by_plot_id(opts[:plot_id])
    |> filter_by_log_type(opts[:log_type])
  end

  defp filter_by_user_id(query, nil), do: query
  defp filter_by_user_id(query, user_id), do: where(query, [t], t.user_id == ^user_id)

  defp filter_by_plot_id(query, nil), do: query
  defp filter_by_plot_id(query, plot_id), do: where(query, [t], t.plot_id == ^plot_id)

  defp filter_by_log_type(query, nil), do: query

  defp filter_by_log_type(query, log_type),
    do: where(query, [t], t.log_type == ^log_type)

  defp apply_ordering(query, opts) do
    order_by = Keyword.get(opts, :order_by, :inserted_at)
    order_dir = Keyword.get(opts, :order_dir, :desc)

    order_by(query, [t], [{^order_dir, field(t, ^order_by)}])
  end

  defp apply_pagination(query, opts) do
    query
    |> apply_limit(opts[:limit])
    |> apply_offset(opts[:offset])
  end

  defp apply_limit(query, nil), do: limit(query, 50)
  defp apply_limit(query, limit), do: limit(query, ^limit)

  defp apply_offset(query, nil), do: query
  defp apply_offset(query, offset), do: offset(query, ^offset)

  defp apply_preloads(query, opts) do
    case opts[:preload] do
      nil -> query
      preloads -> preload(query, ^preloads)
    end
  end
end
