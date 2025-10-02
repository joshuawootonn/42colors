defmodule ApiWeb.Router do
  use ApiWeb, :router

  import ApiWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {ApiWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  app_url = Application.compile_env(:api, :app_url)

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug, origin: app_url
    plug :fetch_session
    plug :fetch_current_user
  end

  scope "/", ApiWeb do
    pipe_through :browser

    get "/", PageController, :home
    get "/up", PageController, :health_check
  end

  # Other scopes may use custom stacks.
  scope "/api", ApiWeb do
    pipe_through :api

    get "/plots", PlotController, :index
    get "/pixels", PixelSubSectionInFileAsBinary, :index

    post "/users/confirm/:token", UserConfirmationController, :update
    delete "/users/log_out", UserSessionController, :delete
  end

  scope "/api", ApiWeb do
    pipe_through [:api, :redirect_if_user_is_authenticated]

    post "/users/log_in", UserSessionController, :create
    post "/users/register", UserRegistrationController, :create
    post "/users/reset_password", UserResetPasswordController, :create
    put "/users/reset_password/:token", UserResetPasswordController, :update
  end

  scope "/api", ApiWeb do
    pipe_through [:api, :require_authenticated_user, :put_channel_token]

    get "/users/me", UserSessionController, :read
    get "/plots/me", PlotController, :me_plots
    get "/logs/me", LogController, :me_logs
  end

  scope "/api", ApiWeb do
    pipe_through [:api, :require_authenticated_user]

    post "/plots", PlotController, :create
    get "/plots/:id", PlotController, :show
    put "/plots/:id", PlotController, :update
    delete "/plots/:id", PlotController, :delete
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:api, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: ApiWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  defp put_channel_token(conn, _) do
    if current_user = conn.assigns[:current_user] do
      token = Phoenix.Token.sign(conn, "pixel socket", current_user.id)
      assign(conn, :channel_token, token)
    else
      conn
    end
  end
end
