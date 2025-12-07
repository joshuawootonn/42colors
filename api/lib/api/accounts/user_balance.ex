defmodule Api.Accounts.UserBalance do
  @moduledoc """
  Helper module for calculating user's available (spendable) balance.
  """

  alias Api.Accounts.User
  alias Api.Repo

  @doc """
  Gets the available (spendable) balance for a user.

  ## Parameters

    * `user_id` - The ID of the user

  ## Returns

    * Integer - The user's balance
  """
  def get_available_balance(user_id) do
    user = Repo.get!(User, user_id)
    user.balance
  end

  @doc """
  Gets the available balance for a user, returning nil if user doesn't exist.
  """
  def get_available_balance_safe(user_id) do
    case Repo.get(User, user_id) do
      nil -> nil
      user -> user.balance
    end
  end
end
