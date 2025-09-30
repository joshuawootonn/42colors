defmodule Api.Logs.Log.Service do
  @moduledoc """
  Service layer for log operations with business logic.
  Handles atomic log creation and balance updates.
  """

  import Ecto.Query, warn: false
  alias Api.Repo
  alias Api.Logs.Log
  alias Api.Accounts.User
  alias Ecto.Multi

  @doc """
  Creates a log and updates the user's balance atomically.

  This function ensures that both the log record is created
  and the user's balance is updated in a single database log,
  guaranteeing consistency.

  ## Parameters

    * `attrs` - Map with log attributes:
      * `:user_id` - Required. The user receiving/spending currency
      * `:amount` - Required. Log amount (positive or negative, but not zero)
      * `:log_type` - Required. One of: "initial_grant", "plot_created", "plot_deleted"
      * `:plot_id` - Optional. Associated plot ID
      * `:metadata` - Optional. Additional context data

  ## Returns

    * `{:ok, {log, user}}` - Success with created log and updated user
    * `{:error, :user_not_found}` - User doesn't exist
    * `{:error, :insufficient_balance}` - User doesn't have enough balance (for negative amounts)
    * `{:error, changeset}` - Validation errors

  ## Examples

      # Creating a plot (spending currency)
      iex> create_log(%{
      ...>   user_id: 1,
      ...>   amount: -100,
      ...>   log_type: "plot_created",
      ...>   plot_id: 5,
      ...>   metadata: %{pixel_count: 100}
      ...> })
      {:ok, {%Log{}, %User{balance: 400}}}

      # Unclaiming a plot (refunding currency)
      iex> create_log(%{
      ...>   user_id: 1,
      ...>   amount: 100,
      ...>   log_type: "plot_deleted",
      ...>   plot_id: 5,
      ...>   metadata: %{pixel_count: 100}
      ...> })
      {:ok, {%Log{}, %User{balance: 500}}}

      # Insufficient balance
      iex> create_log(%{
      ...>   user_id: 1,
      ...>   amount: -1000,
      ...>   log_type: "plot_created"
      ...> })
      {:error, :insufficient_balance}

  """
  def create_log(attrs) do
    user_id = Map.get(attrs, :user_id) || Map.get(attrs, "user_id")
    amount = Map.get(attrs, :amount) || Map.get(attrs, "amount")

    Multi.new()
    |> Multi.run(:user, fn _repo, _changes ->
      if is_nil(user_id) do
        {:error, :user_id_required}
      else
        case Repo.get(User, user_id) do
          nil -> {:error, :user_not_found}
          user -> {:ok, user}
        end
      end
    end)
    |> Multi.run(:check_balance, fn _repo, %{user: user} ->
      new_balance = user.balance + amount

      if new_balance < 0 do
        {:error, :insufficient_balance}
      else
        {:ok, new_balance}
      end
    end)
    |> Multi.insert(:log, fn _changes ->
      Log.changeset(%Log{}, attrs)
    end)
    |> Multi.run(:update_balance, fn _repo, %{user: user, check_balance: new_balance} ->
      user
      |> Ecto.Changeset.change(balance: new_balance)
      |> Repo.update()
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{log: log, update_balance: user}} ->
        {:ok, {log, user}}

      {:error, :user, :user_id_required, _changes} ->
        {:error, :user_id_required}

      {:error, :user, :user_not_found, _changes} ->
        {:error, :user_not_found}

      {:error, :check_balance, :insufficient_balance, _changes} ->
        {:error, :insufficient_balance}

      {:error, :log, changeset, _changes} ->
        {:error, changeset}

      {:error, _failed_operation, reason, _changes} ->
        {:error, reason}
    end
  end

  @doc """
  Creates a log for creating a plot.

  Convenience wrapper that calculates the cost and creates the appropriate log.

  ## Parameters

    * `user_id` - ID of the user creating the plot
    * `plot_id` - ID of the plot being created
    * `pixel_count` - Number of pixels in the plot

  ## Returns

    * `{:ok, {log, user}}` - Success
    * `{:error, reason}` - Error

  ## Examples

      iex> create_create_plot_log(1, 5, 100)
      {:ok, {%Log{amount: -100}, %User{balance: 400}}}

  """
  def create_create_plot_log(user_id, plot_id, pixel_count) do
    create_log(%{
      user_id: user_id,
      amount: -pixel_count,
      log_type: "plot_created",
      plot_id: plot_id,
      metadata: %{pixel_count: pixel_count}
    })
  end

  @doc """
  Gets the current balance for a user.

  ## Examples

      iex> get_user_balance(1)
      {:ok, 500}

      iex> get_user_balance(999)
      {:error, :user_not_found}

  """
  def get_user_balance(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user.balance}
    end
  end
end
