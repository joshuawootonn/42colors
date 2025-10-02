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
      * `:old_balance` - Required. User's balance before the transaction
      * `:new_balance` - Required. User's balance after the transaction
      * `:log_type` - Required. One of: "initial_grant", "plot_created", "plot_deleted"
      * `:plot_id` - Optional. Associated plot ID
      * `:diffs` - Optional. JSON diff data

  ## Returns

    * `{:ok, {log, user}}` - Success with created log and updated user
    * `{:error, :user_not_found}` - User doesn't exist
    * `{:error, :insufficient_balance}` - User doesn't have enough balance (for negative amounts)
    * `{:error, changeset}` - Validation errors

  ## Examples

      # Creating a plot (spending currency)
      iex> create_log(%{
      ...>   user_id: 1,
      ...>   old_balance: 500,
      ...>   new_balance: 400,
      ...>   log_type: "plot_created",
      ...>   plot_id: 5,
      ...>   diffs: %{"pixel_count" => %{"old" => 0, "new" => 100}}
      ...> })
      {:ok, {%Log{}, %User{balance: 400}}}

      # Unclaiming a plot (refunding currency)
      iex> create_log(%{
      ...>   user_id: 1,
      ...>   old_balance: 400,
      ...>   new_balance: 500,
      ...>   log_type: "plot_deleted",
      ...>   plot_id: 5,
      ...>   diffs: %{"pixel_count" => %{"old" => 100, "new" => 0}}
      ...> })
      {:ok, {%Log{}, %User{balance: 500}}}

      # Insufficient balance
      iex> create_log(%{
      ...>   user_id: 1,
      ...>   old_balance: 100,
      ...>   new_balance: -900,
      ...>   log_type: "plot_created"
      ...> })
      {:error, :insufficient_balance}

  """
  def create_log(attrs) do
    user_id = Map.get(attrs, :user_id) || Map.get(attrs, "user_id")
    new_balance = Map.get(attrs, :new_balance) || Map.get(attrs, "new_balance")

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
    |> Multi.run(:check_balance, fn _repo, %{user: _user} ->
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
  Calculates balance changes for logging.

  ## Parameters

    * `old_balance` - The user's current balance before the transaction
    * `amount` - The amount being added/subtracted (positive or negative)

  ## Returns

    * Map with `old_balance` and `new_balance` keys

  ## Examples

      iex> calculate_balance_change(1500, -100)
      %{old_balance: 1500, new_balance: 1400}

      iex> calculate_balance_change(1000, 200)
      %{old_balance: 1000, new_balance: 1200}

  """
  def calculate_balance_change(old_balance, amount) do
    new_balance = old_balance + amount

    %{
      old_balance: old_balance,
      new_balance: new_balance
    }
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
      {:ok, {%Log{old_balance: 500, new_balance: 400}, %User{balance: 400}}}

  """
  def create_create_plot_log(user_id, plot_id, pixel_count) do
    case Repo.get(User, user_id) do
      nil ->
        {:error, :user_not_found}

      user ->
        amount = -pixel_count
        balance_change = calculate_balance_change(user.balance, amount)

        create_log(%{
          user_id: user_id,
          old_balance: balance_change.old_balance,
          new_balance: balance_change.new_balance,
          log_type: "plot_created",
          plot_id: plot_id,
          diffs: %{
            "pixel_count" => %{"old" => 0, "new" => pixel_count}
          }
        })
    end
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
