defmodule ApiWeb.GoogleAuthController do
  alias Api.Accounts
  require Logger
  use ApiWeb, :controller
  alias Api.Accounts

  @doc """
  `index/2` handles the callback from Google Auth API redirect.
  """
  def index(conn, %{"code" => code}) do
    api_url = Application.get_env(:api, :api_url)

    Logger.info(">> Getting token with #{api_url}")

    {:ok, token} = ElixirAuthGoogle.get_token(code, api_url)
    {:ok, user_profile} = ElixirAuthGoogle.get_user_profile(token.access_token)

    Accounts.register_oauth_user(%{
      email: user_profile.email,
      name: user_profile.name
    })

    user = Accounts.get_user_by_email(user_profile.email)
    Accounts.insert_oauth_token(Map.merge(token, %{user_id: user.id}))

    app_url = Application.get_env(:api, :app_url)
    env = Application.get_env(:api, :env)

    domain = if env == "dev", do: nil, else: "42colors.com"

    Logger.info(">> Returning token with domain: #{domain} based on env: #{env}")

    conn =
      put_resp_cookie(conn, "token", token.access_token,
        http_only: false,
        domain: domain
      )

    Logger.info(">> Login successful redirecting to #{app_url}")

    redirect(conn, external: app_url)
  end

  def show(conn, _params) do
    api_url = Application.get_env(:api, :api_url)
    url = ElixirAuthGoogle.generate_oauth_url(api_url)

    render(conn, :show, url: url)
  end
end
