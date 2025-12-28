defmodule Api.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Api.Repo

  alias Api.Accounts.{User, UserToken, UserNotifier}

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
  Gets a user by email and password.

  ## Examples

      iex> get_user_by_email_and_password("foo@example.com", "correct_password")
      %User{}

      iex> get_user_by_email_and_password("foo@example.com", "invalid_password")
      nil

  """
  def get_user_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    user = Repo.get_by(User, email: email)
    if User.valid_password?(user, password), do: user
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

  @doc """
  Gets a single user by ID.

  Returns nil if the User does not exist.

  ## Examples

      iex> get_user(123)
      %User{}

      iex> get_user(456)
      nil

  """
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Searches for users by email (case-insensitive partial match).

  ## Examples

      iex> search_users_by_email("john")
      [%User{email: "john@example.com"}, ...]

  """
  def search_users_by_email(query) when is_binary(query) do
    query_lower = String.downcase(query)

    from(u in User,
      where: ilike(fragment("lower(?)", u.email), ^"%#{query_lower}%"),
      limit: 20,
      order_by: [asc: u.email]
    )
    |> Repo.all()
  end

  ## User registration

  @doc """
  Registers a user.

  ## Examples

      iex> register_user(%{field: value})
      {:ok, %User{}}

      iex> register_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def register_user(attrs) do
    alias Api.Logs.Log.Service, as: LogService
    alias Ecto.Multi

    # First, create the user
    case Multi.new()
         |> Multi.insert(:user, fn _changes ->
           %User{}
           |> User.registration_changeset(attrs)
         end)
         |> Repo.transaction() do
      {:ok, %{user: user}} ->
        # Generate and set the username using the new user's ID
        username = User.generate_username(user.id)

        {:ok, user_with_username} =
          user
          |> Ecto.Changeset.change(username: username)
          |> Repo.update()

        # Calculate balance change using the public function
        balance_change = LogService.calculate_balance_change(user_with_username.balance, 2000)

        # Create the initial grant log
        case LogService.create_log(%{
               user_id: user_with_username.id,
               old_balance: balance_change.old_balance,
               new_balance: balance_change.new_balance,
               log_type: "initial_grant",
               diffs: %{
                 "reason" => "Initial grant for new user",
                 "grant_amount" => 2000
               }
             }) do
          {:ok, {_log, updated_user}} ->
            {:ok, updated_user}

          {:error, reason} ->
            {:error, reason}
        end

      {:error, :user, changeset, _changes} ->
        {:error, changeset}

      {:error, _failed_operation, reason, _changes} ->
        {:error, reason}
    end
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user_registration(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user_registration(%User{} = user, attrs \\ %{}) do
    User.registration_changeset(user, attrs, hash_password: false, validate_email: false)
  end

  ## Settings

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the user email.

  ## Examples

      iex> change_user_email(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user_email(user, attrs \\ %{}) do
    User.email_changeset(user, attrs, validate_email: false)
  end

  @doc """
  Emulates that the email will change without actually changing
  it in the database.

  ## Examples

      iex> apply_user_email(user, "valid password", %{email: ...})
      {:ok, %User{}}

      iex> apply_user_email(user, "invalid password", %{email: ...})
      {:error, %Ecto.Changeset{}}

  """
  def apply_user_email(user, password, attrs) do
    user
    |> User.email_changeset(attrs)
    |> User.validate_current_password(password)
    |> Ecto.Changeset.apply_action(:update)
  end

  @doc """
  Updates the user email using the given token.

  If the token matches, the user email is updated and the token is deleted.
  The confirmed_at date is also updated to the current time.
  """
  def update_user_email(user, token) do
    context = "change:#{user.email}"

    with {:ok, query} <- UserToken.verify_change_email_token_query(token, context),
         %UserToken{sent_to: email} <- Repo.one(query),
         {:ok, _} <- Repo.transaction(user_email_multi(user, email, context)) do
      :ok
    else
      _ -> :error
    end
  end

  defp user_email_multi(user, email, context) do
    changeset =
      user
      |> User.email_changeset(%{email: email})
      |> User.confirm_changeset()

    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, changeset)
    |> Ecto.Multi.delete_all(:tokens, UserToken.by_user_and_contexts_query(user, [context]))
  end

  @doc ~S"""
  Delivers the update email instructions to the given user.

  ## Examples

      iex> deliver_user_update_email_instructions(user, current_email, &url(~p"/users/settings/confirm_email/#{&1}"))
      {:ok, %{to: ..., body: ...}}

  """
  def deliver_user_update_email_instructions(%User{} = user, current_email, update_email_url_fun)
      when is_function(update_email_url_fun, 1) do
    {encoded_token, user_token} = UserToken.build_email_token(user, "change:#{current_email}")

    Repo.insert!(user_token)
    UserNotifier.deliver_update_email_instructions(user, update_email_url_fun.(encoded_token))
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the user password.

  ## Examples

      iex> change_user_password(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user_password(user, attrs \\ %{}) do
    User.password_changeset(user, attrs, hash_password: false)
  end

  @doc """
  Updates the user password.

  ## Examples

      iex> update_user_password(user, "valid password", %{password: ...})
      {:ok, %User{}}

      iex> update_user_password(user, "invalid password", %{password: ...})
      {:error, %Ecto.Changeset{}}

  """
  def update_user_password(user, password, attrs) do
    changeset =
      user
      |> User.password_changeset(attrs)
      |> User.validate_current_password(password)

    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, changeset)
    |> Ecto.Multi.delete_all(:tokens, UserToken.by_user_and_contexts_query(user, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{user: user}} -> {:ok, user}
      {:error, :user, changeset, _} -> {:error, changeset}
    end
  end

  ## Session

  @doc """
  Generates a session token.
  """
  def generate_user_session_token(user) do
    {token, user_token} = UserToken.build_session_token(user)
    Repo.insert!(user_token)
    token
  end

  @doc """
  Gets the user with the given signed token.
  """
  def get_user_by_session_token(token) do
    {:ok, query} = UserToken.verify_session_token_query(token)
    Repo.one(query)
  end

  @doc """
  Deletes the signed token with the given context.
  """
  def delete_user_session_token(token) do
    Repo.delete_all(UserToken.by_token_and_context_query(token, "session"))
    :ok
  end

  ## Confirmation

  @doc ~S"""
  Delivers the confirmation email instructions to the given user.

  ## Examples

      iex> deliver_user_confirmation_instructions(user, &url(~p"/users/confirm/#{&1}"))
      {:ok, %{to: ..., body: ...}}

      iex> deliver_user_confirmation_instructions(confirmed_user, &url(~p"/users/confirm/#{&1}"))
      {:error, :already_confirmed}

  """
  def deliver_user_confirmation_instructions(%User{} = user, confirmation_url_fun)
      when is_function(confirmation_url_fun, 1) do
    if user.confirmed_at do
      {:error, :already_confirmed}
    else
      {encoded_token, user_token} = UserToken.build_email_token(user, "confirm")
      Repo.insert!(user_token)
      UserNotifier.deliver_confirmation_instructions(user, confirmation_url_fun.(encoded_token))
    end
  end

  @doc """
  Confirms a user by the given token.

  If the token matches, the user account is marked as confirmed
  and the token is deleted.
  """
  def confirm_user(token) do
    with {:ok, query} <- UserToken.verify_email_token_query(token, "confirm"),
         %User{} = user <- Repo.one(query),
         {:ok, %{user: user}} <- Repo.transaction(confirm_user_multi(user)) do
      {:ok, user}
    else
      _ -> :error
    end
  end

  defp confirm_user_multi(user) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, User.confirm_changeset(user))
    |> Ecto.Multi.delete_all(:tokens, UserToken.by_user_and_contexts_query(user, ["confirm"]))
  end

  ## Reset password

  @doc ~S"""
  Delivers the reset password email to the given user.

  ## Examples

      iex> deliver_user_reset_password_instructions(user, &url(~p"/users/reset_password/#{&1}"))
      {:ok, %{to: ..., body: ...}}

  """
  def deliver_user_reset_password_instructions(%User{} = user, reset_password_url_fun)
      when is_function(reset_password_url_fun, 1) do
    {encoded_token, user_token} = UserToken.build_email_token(user, "reset_password")
    Repo.insert!(user_token)
    UserNotifier.deliver_reset_password_instructions(user, reset_password_url_fun.(encoded_token))
  end

  @doc """
  Gets the user by reset password token.

  ## Examples

      iex> get_user_by_reset_password_token("validtoken")
      %User{}

      iex> get_user_by_reset_password_token("invalidtoken")
      nil

  """
  def get_user_by_reset_password_token(token) do
    with {:ok, query} <- UserToken.verify_email_token_query(token, "reset_password"),
         %User{} = user <- Repo.one(query) do
      user
    else
      _ -> nil
    end
  end

  @doc """
  Resets the user password.

  ## Examples

      iex> reset_user_password(user, %{password: "new long password", password_confirmation: "new long password"})
      {:ok, %User{}}

      iex> reset_user_password(user, %{password: "valid", password_confirmation: "not the same"})
      {:error, %Ecto.Changeset{}}

  """
  def reset_user_password(user, attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:user, User.password_changeset(user, attrs))
    |> Ecto.Multi.delete_all(:tokens, UserToken.by_user_and_contexts_query(user, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{user: user}} -> {:ok, user}
      {:error, :user, changeset, _} -> {:error, changeset}
    end
  end

  @doc """
  Checks if a user is eligible for a daily visit grant (without granting it).

  Returns true if the user can claim their daily grant, false otherwise.

  ## Examples

      iex> can_claim_daily_visit_grant?(user)
      true

      iex> can_claim_daily_visit_grant?(user)
      false

  """
  def can_claim_daily_visit_grant?(%User{} = user) do
    today = DateTime.utc_now() |> DateTime.to_date()
    account_creation_date = user.inserted_at |> DateTime.to_date()

    case user.last_visit_grant_at do
      nil ->
        # Never claimed before - but don't allow on account creation day
        Date.compare(account_creation_date, today) == :lt

      last_grant_time ->
        # Check if last grant was on a different day
        last_grant_date = last_grant_time |> DateTime.to_date()
        Date.compare(last_grant_date, today) == :lt
    end
  end

  @doc """
  Grants a daily visit grant to the user if they are eligible.

  A user is eligible if:
  - They have never received a grant (last_visit_grant_at is nil) AND it's not their account creation day, OR
  - Their last grant was on a different UTC day than today

  The grant amount is 1000 pixels.

  ## Returns

    * `{:ok, {log, user}}` - Grant granted successfully
    * `{:ok, :already_claimed_today}` - User already claimed grant today
    * `{:error, reason}` - Error occurred

  ## Examples

      iex> grant_daily_visit_grant(user)
      {:ok, {%Log{}, %User{balance: 2100}}}

      iex> grant_daily_visit_grant(user)
      {:ok, :already_claimed_today}

  """
  def grant_daily_visit_grant(%User{} = user) do
    alias Api.Logs.Log.Service, as: LogService

    today = DateTime.utc_now() |> DateTime.to_date()

    if can_claim_daily_visit_grant?(user) do
      # Grant the grant
      grant_amount = 1000
      current_user = Repo.get!(User, user.id)
      balance_change = LogService.calculate_balance_change(current_user.balance, grant_amount)

      # Create the daily visit grant log
      case LogService.create_log(%{
             user_id: user.id,
             old_balance: balance_change.old_balance,
             new_balance: balance_change.new_balance,
             log_type: "daily_visit_grant",
             diffs: %{
               "reason" => "Daily visit grant",
               "grant_amount" => grant_amount,
               "date" => Date.to_string(today)
             }
           }) do
        {:ok, {log, updated_user}} ->
          # Update the last_visit_grant_at timestamp
          updated_user
          |> Ecto.Changeset.change(
            last_visit_grant_at: DateTime.utc_now() |> DateTime.truncate(:second)
          )
          |> Repo.update()
          |> case do
            {:ok, final_user} -> {:ok, {log, final_user}}
            {:error, reason} -> {:error, reason}
          end

        {:error, reason} ->
          {:error, reason}
      end
    else
      {:ok, :already_claimed_today}
    end
  end
end
