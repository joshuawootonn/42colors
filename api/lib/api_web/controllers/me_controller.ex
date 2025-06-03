defmodule ApiWeb.MeController do
  require Logger
  use ApiWeb, :controller
  alias Api.Accounts

  action_fallback ApiWeb.FallbackController

  def show(conn, _params) do
    Logger.info(get_req_header(conn, "authorization"))

    with ["Bearer: " <> token] <- get_req_header(conn, "authorization") do
      with {:ok, account} <- Accounts.get_user_by_session_token(token) do
        user = Accounts.get_user!(account.user_id)
        render(conn, :show, %{name: user.name, email: user.email, id: user.id})
      end
    end
  end
end
