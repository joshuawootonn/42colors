defmodule ApiWeb.GoogleAuthController do
  require Logger
  use ApiWeb, :controller

  @doc """
  `index/2` handles the callback from Google Auth API redirect.
  """
  def index(conn, %{"code" => code}) do
    {:ok, token} = ElixirAuthGoogle.get_token(code, ApiWeb.Endpoint.url())

    conn = put_resp_cookie(conn, "token", token.access_token, http_only: false)

    app_url = Application.get_env(:api, :app_url)
    Logger.info(">> Login successful redirecting to #{app_url}")

    redirect(conn, external: app_url)
  end

  def show(conn, _params) do
    api_url = Application.get_env(:api, :api_url)
    url = ElixirAuthGoogle.generate_oauth_url(api_url)

    render(conn, :show, url: url)
  end
end
