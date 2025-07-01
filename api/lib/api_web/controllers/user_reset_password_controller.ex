defmodule ApiWeb.UserResetPasswordController do
  use ApiWeb, :controller

  alias Api.Accounts

  plug :get_user_by_reset_password_token when action in [:update]

  def create(conn, %{"user" => %{"email" => email}}) do
    if user = Accounts.get_user_by_email(email) do
      Accounts.deliver_user_reset_password_instructions(
        user,
        fn token -> "#{Application.get_env(:api, :app_url)}/forgot-password/#{token}" end
      )
    end

    conn
    |> json(%{
      status: "success",
      message:
        "If your email is in our system, you will receive instructions to reset your password shortly."
    })
  end

  # def edit(conn, _params) do
  #   render(conn, :edit, changeset: Accounts.change_user_password(conn.assigns.user))
  # end

  # Do not log in the user after reset password to avoid a
  # leaked token giving the user access to the account.
  def update(conn, %{"user" => user_params}) do
    case Accounts.reset_user_password(conn.assigns.user, user_params) do
      {:ok, user} ->
        conn
        |> json(%{
          status: "success",
          message: "Password reset successfully.",
          user: %{
            email: user.email
          }
        })

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          status: "error",
          message: "Password reset failed",
          errors: format_changeset_errors(changeset)
        })
    end
  end

  defp get_user_by_reset_password_token(conn, _opts) do
    %{"token" => token} = conn.params

    if user = Accounts.get_user_by_reset_password_token(token) do
      conn |> assign(:user, user) |> assign(:token, token)
    else
      conn
      |> put_status(:unauthorized)
      |> json(%{
        status: "error",
        message: "Reset password link is invalid or it has expired."
      })
      |> halt()
    end
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
