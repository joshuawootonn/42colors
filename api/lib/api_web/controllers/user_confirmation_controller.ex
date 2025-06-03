defmodule ApiWeb.UserConfirmationController do
  use ApiWeb, :controller

  alias Api.Accounts

  # Do not log in the user after confirmation to avoid a
  # leaked token giving the user access to the account.
  def update(conn, %{"token" => token}) do
    case Accounts.confirm_user(token) do
      {:ok, user} ->
        conn
        |> json(%{
          status: "success",
          message: "User confirmed successfully.",
          user: %{
            email: user.email
          }
        })

      :error ->
        # If there is a current user and the account was already confirmed,
        # then odds are that the confirmation link was already visited, either
        # by some automation or by the user themselves, so we return success
        case conn.assigns do
          %{current_user: %{confirmed_at: confirmed_at}} when not is_nil(confirmed_at) ->
            conn
            |> json(%{
              status: "success",
              message: "User already confirmed."
            })

          %{} ->
            conn
            |> put_status(:unauthorized)
            |> json(%{
              status: "error",
              message: "User confirmation link is invalid or it has expired."
            })
        end
    end
  end
end
