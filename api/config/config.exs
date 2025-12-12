# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :api,
  ecto_repos: [Api.Repo],
  generators: [timestamp_type: :utc_datetime]

# Configures the endpoint
config :api, ApiWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: ApiWeb.ErrorHTML, json: ApiWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Api.PubSub,
  live_view: [signing_salt: "Oc7Yr0MX"]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :api, Api.Mailer, adapter: Swoosh.Adapters.Local

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.17.11",
  api: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.4.3",
  api: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

client_id = System.get_env("GOOGLE_CLIENT_ID")
client_secret = System.get_env("GOOGLE_CLIENT_SECRET")
# Google Auth Credentials
config :elixir_auth_google,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")

# Callback URL from Google Auth
app_url = System.get_env("APP_URL") || "https://42colors.com"
api_url = System.get_env("API_URL") || "https://api.42colors.com"
env = System.get_env("ENV") || "prod"

config :api, :app_url, app_url
config :api, :api_url, api_url
config :api, :env, env

require Logger
Logger.info("Config loaded with #{app_url} / #{api_url} / #{client_secret} / #{client_id}")

# Configure Oban for background jobs
config :api, Oban,
  repo: Api.Repo,
  queues: [default: 10],
  plugins: [
    # Prune completed/cancelled/discarded jobs after 7 days
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    # Cron-scheduled jobs
    {Oban.Plugins.Cron,
     crontab: [
       # Vote settlement every 5 minutes (settles unsettled votes from last hour)
       {"* * * * *", Api.Workers.VoteSettlementWorker}
     ]}
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"

config :cors_plug,
  origin: [app_url],
  max_age: 86400,
  methods: ["GET", "POST", "DELETE", "PUT"]
