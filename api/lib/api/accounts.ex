defmodule Api.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Api.Repo

  alias Api.Accounts.{User}
  alias Api.{Account}

  ## Database getters

  @doc """
  Gets a user by email.

  ## Examples

      iex> get_user_by_email("foo@example.com")
      %User{}

      iex> get_user_by_email("unknown@example.com")
      nil

  """
  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id), do: Repo.get!(User, id)

  def register_oauth_user(attrs) do
    %User{}
    |> User.oauth_registration_changeset(attrs, validate_email: false)
    |> Repo.insert(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: [:email]
    )
  end

  def insert_oauth_token(attrs) do
    %Account{}
    |> Account.changeset(attrs)
    |> Repo.insert()
  end

  def get_user_by_token(token) do
    current_time = DateTime.utc_now()
    one_hour_ago = DateTime.add(current_time, -3600)

    Repo.one(from a in Account, where: a.updated_at >= ^one_hour_ago and a.access_token == ^token)
  end

  # def get_user_by_token(token) do
  #   {:ok, query} = UserToken.verify_session_token_query(token)
  #   Repo.one(query)
  # end
end
