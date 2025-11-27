defmodule Api.Accounts.UserBalance do
  @moduledoc """
  Helper module for calculating user's available (spendable) balance.

  The available balance is the settled balance minus any unsettled cast votes.
  This ensures users can't overspend by casting votes before they settle.
  """

  alias Api.Canvas.Vote
  alias Api.Accounts.User
  alias Api.Repo

  @doc """
  Calculates the available (spendable) balance for a user.

  ## Parameters

    * `user_id` - The ID of the user

  ## Returns

    * Integer - The available balance (settled balance - unsettled cast votes)

  ## Examples

      iex> get_available_balance(1)
      1850  # User has 2000 settled, 150 unsettled votes cast

  """
  def get_available_balance(user_id) do
    user = Repo.get!(User, user_id)
    unsettled_cast_total = Vote.Repo.get_user_unsettled_cast_total(user_id)
    user.balance - unsettled_cast_total
  end

  @doc """
  Calculates the available balance for a user, returning nil if user doesn't exist.
  """
  def get_available_balance_safe(user_id) do
    case Repo.get(User, user_id) do
      nil ->
        nil

      user ->
        unsettled_cast_total = Vote.Repo.get_user_unsettled_cast_total(user_id)
        user.balance - unsettled_cast_total
    end
  end
end
