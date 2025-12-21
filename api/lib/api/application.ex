defmodule Api.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ApiWeb.Telemetry,
      Api.PromEx,
      Api.Repo,
      {Oban, Application.fetch_env!(:api, Oban)},
      {DNSCluster, query: Application.get_env(:api, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Api.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: Api.Finch},
      # Start Redis cache before the pixel cache supervisor
      Api.PixelCache.Redis,
      # Start to serve requests, typically the last entry
      ApiWeb.Endpoint,
      ApiWeb.PixelCacheSupervisor
    ]

    opts = [strategy: :one_for_one, name: Api.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ApiWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
