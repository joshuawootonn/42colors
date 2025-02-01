defmodule ApiWeb.Router do
  use ApiWeb, :router

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
  end

  scope "/", ApiWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  scope "/auth", ApiWeb do
    pipe_through :browser

    get "/google/callback", GoogleAuthController, :index
    # get "/", GoogleAuthController, :auth
  end

  # Other scopes may use custom stacks.
  scope "/api", ApiWeb do
    pipe_through :api
    resources "/pixels", PixelController, except: [:new, :edit]
    resources "/pixels2", PixelProtobufController, except: [:new, :edit]
    resources "/pixels3", PixelInMemoryController, except: [:new, :edit]
    resources "/pixels4", PixelInMemoryControllerPreEncoded, except: [:new, :edit]

    get "/me", MeController, :show

    get "/auth_url", GoogleAuthController, :show
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
end
