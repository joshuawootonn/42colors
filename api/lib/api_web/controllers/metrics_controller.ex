defmodule ApiWeb.MetricsController do
  use ApiWeb, :controller

  def index(conn, _params) do
    metrics = PromEx.get_metrics(Api.PromEx)

    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, metrics)
  end
end
