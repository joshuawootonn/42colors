defmodule ApiWeb.MeController do
  require Logger
  use ApiWeb, :controller
  alias Api.Accounts

  action_fallback ApiWeb.FallbackController

  def show(conn, _params) do
    Logger.info(get_req_header(conn, "authorization"))

    with ["Bearer: " <> token] <- get_req_header(conn, "authorization") do
      account = Accounts.get_user_by_token(token)
      user = Accounts.get_user!(account.user_id)
      render(conn, :show, %{name: user.name, email: user.email})
    else
      _ ->
        conn
        |> send_resp(:unauthorized, "No access for you")
        |> halt()
    end
  end
end
