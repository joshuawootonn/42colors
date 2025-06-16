defmodule ApiWeb.UserRegistrationController do
  use ApiWeb, :controller

  alias Api.Accounts
  alias ApiWeb.UserAuth

  def create(conn, %{"user" => user_params}) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        {:ok, _} =
          Accounts.deliver_user_confirmation_instructions(
            user,
            fn token -> "#{Application.get_env(:api, :app_url)}/confirm-email/#{token}" end
          )

        conn
        |> UserAuth.log_in_user(user)
        |> json(%{
          status: "success",
          message: "User created successfully.",
          user: %{
            email: user.email
          }
        })

      {:error, %Ecto.Changeset{} = _} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          status: "error",
          message: "Registration failed",
          errors: []
        })
    end
  end
end
