defmodule ApiWeb.MeController do
  require Logger
  use ApiWeb, :controller

  action_fallback ApiWeb.FallbackController

  def show(conn, _params) do
    Logger.info(get_req_header(conn, "authorization"))

    with ["Bearer: " <> token] <- get_req_header(conn, "authorization") do
      Logger.info("\n\n\n")
      Logger.info(token)
      Logger.info("\n\n\n")
      {:ok, profile} = ElixirAuthGoogle.get_user_profile(token)
      Logger.info("\n\n\n")
      Logger.info(profile)
      Logger.info("\n\n\n")
      render(conn, :show, profile: profile)
    else
      _ ->
        conn
        |> send_resp(:unauthorized, "No access for you")
        |> halt()
    end
  end
end
