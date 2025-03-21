import Config

# Note we also include the path to a cache manifest
# containing the digested version of static files. This
# manifest is generated by the `mix assets.deploy` task,
# which you should run after static files are built and
# before starting your production server.
config :api, ApiWeb.Endpoint, cache_static_manifest: "priv/static/cache_manifest.json"

# Configures Swoosh API Client
config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: Api.Finch

# Disable Swoosh Local Memory Storage
config :swoosh, local: false

# Do not print debug messages in production
# config :logger, level: :info
config :logger, :console, format: "[$level] $message\n"

# Runtime production configuration, including reading
# of environment variables, is done on config/runtime.exs.
config :api, Api.PixelCache,
  canvas_height: 10000,
  canvas_width: 10000,
  viewport_diameter: 400,
  pixel_cache_file_name: "pixel_cache.bin"
