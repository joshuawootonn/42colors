defmodule ApiWeb.GoogleAuthController do
  require Logger
  use ApiWeb, :controller

  @doc """
  `index/2` handles the callback from Google Auth API redirect.
  """
  def index(conn, %{"code" => code}) do
    {:ok, token} = ElixirAuthGoogle.get_token(code, ApiWeb.Endpoint.url())

    conn = put_resp_cookie(conn, "token", token.access_token, http_only: false)

    redirect(conn, external: System.get_env("APP_URL"))
  end

  def show(conn, _params) do
    url = ElixirAuthGoogle.generate_oauth_url(conn)

    render(conn, :show, url: url)
  end
end
