defmodule ApiWeb.UserSessionController do
  use ApiWeb, :controller

  alias Api.Accounts
  alias Api.Accounts.User
  alias ApiWeb.UserAuth

  def create(conn, %{"user" => user_params}) do
    changeset = User.login_changeset(%User{}, user_params)

    if changeset.valid? do
      %{"email" => email, "password" => password} = user_params

      if user = Accounts.get_user_by_email_and_password(email, password) do
        conn
        |> UserAuth.log_in_user(user, user_params)
        |> json(%{
          status: "success",
          message: "Welcome back!",
          user: %{
            email: user.email
          }
        })
      else
        # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
        conn
        |> put_status(:unauthorized)
        |> json(%{
          status: "error",
          message: "Invalid email or password",
          errors: %{
            root: ["Invalid email or password"]
          }
        })
      end
    else
      conn
      |> put_status(:unprocessable_entity)
      |> json(%{
        status: "error",
        message: "Login failed",
        errors: format_changeset_errors(changeset)
      })
    end
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end

  @spec delete(Plug.Conn.t(), any()) :: Plug.Conn.t()
  def delete(conn, _params) do
    conn
    |> UserAuth.log_out_user()
    |> json(%{
      status: "success",
      message: "Logged out successfully."
    })
  end

  def read(conn, _params) do
    user = conn.assigns.current_user
    channel_token = conn.assigns.channel_token

    json(conn, %{
      status: "success",
      user: %{
        email: user.email,
        id: user.id,
        balance: user.balance,
        channel_token: channel_token
      }
    })
  end
end
