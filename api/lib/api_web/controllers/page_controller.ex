defmodule ApiWeb.PageController do
  use ApiWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    send_resp(conn, 200, "What's up brother!")
  end

  def health_check(conn, _params) do
    send_resp(conn, 200, "We are up and running!")
  end
end
