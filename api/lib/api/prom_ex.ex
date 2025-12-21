defmodule Api.PromEx do
  use PromEx, otp_app: :api

  alias PromEx.Plugins

  @impl true
  def plugins do
    [
      # BEAM VM metrics (memory, processes, schedulers, etc.)
      Plugins.Beam,

      # Application info (uptime, version, etc.)
      {Plugins.Application, otp_app: :api},

      # Phoenix endpoint and router metrics
      {Plugins.Phoenix, router: ApiWeb.Router, endpoint: ApiWeb.Endpoint},

      # Ecto query and pool metrics
      {Plugins.Ecto, repos: [Api.Repo]},

      # Oban job metrics
      {Plugins.Oban, oban_supervisors: [Oban]}
    ]
  end

  @impl true
  def dashboard_assigns do
    [
      datasource_id: "prometheus",
      default_selected_interval: "30s"
    ]
  end

  @impl true
  def dashboards do
    [
      # Pre-built Grafana dashboards from PromEx
      {:prom_ex, "application.json"},
      {:prom_ex, "beam.json"},
      {:prom_ex, "phoenix.json"},
      {:prom_ex, "ecto.json"},
      {:prom_ex, "oban.json"}
    ]
  end
end
