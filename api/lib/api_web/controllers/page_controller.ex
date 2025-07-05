defmodule ApiWeb.PageController do
  use ApiWeb, :controller

  def home(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "What's up brother?!")
  end

  def health_check(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "We are up and running!")
  end
end
