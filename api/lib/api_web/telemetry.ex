defmodule ApiWeb.Telemetry do
  alias ApiWeb.TelemetryHelper
  use Supervisor

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  require Logger

  def setup do
    events = [
      [:my_app, :action, :format_pixels],
      [:my_app, :action, :encode_pixels],
      [:my_app, :action, :list_pixels],
      [:my_app, :action, :initialize_file],
      [:my_app, :action, :write_matrix_to_file],
      [:my_app, :action, :write_coordinates_to_file],
      [:my_app, :action, :list_pixel_subsection_from_file],
      [:my_app, :action, :list_pixel_subsection_from_file_as_binary],
      [:my_app, :action, :list_pixels_from_file]
    ]

    :telemetry.attach_many(
      "action-handler",
      events,
      &TelemetryHelper.handle_event/4,
      nil
    )
  end

  @impl true
  def init(_arg) do
    children = [
      # Telemetry poller will execute the given period measurements
      # every 10_000ms. Learn more here: https://hexdocs.pm/telemetry_metrics
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000},
      # Add reporters as children of your supervision tree.
      {Telemetry.Metrics.ConsoleReporter, metrics: metrics()}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    import Telemetry.Metrics

    base_metrics = [
      # Minimal metric required for LiveDashboard to render
      summary("vm.memory.total", unit: {:byte, :kilobyte})
    ]

    prod_metrics = [
      # Phoenix Metrics
      summary("phoenix.endpoint.stop.duration",
        unit: {:native, :millisecond}
      ),
      summary("phoenix.router_dispatch.stop.duration",
        tags: [:route],
        unit: {:native, :millisecond}
      ),

      # Database Metrics
      summary("api.repo.query.total_time",
        unit: {:native, :millisecond},
        description: "The sum of the other measurements"
      ),
      summary("api.repo.query.query_time",
        unit: {:native, :millisecond},
        description: "The time spent executing the query"
      ),
      summary("api.repo.query.queue_time",
        unit: {:native, :millisecond},
        description: "The time spent waiting for a database connection"
      ),

      # VM Metrics
      summary("vm.total_run_queue_lengths.total"),
      summary("vm.total_run_queue_lengths.cpu"),
      summary("vm.total_run_queue_lengths.io")
    ]

    if Application.get_env(:api, :env) == "prod" do
      base_metrics ++ prod_metrics
    else
      base_metrics
    end
  end

  defp periodic_measurements do
    [
      # A module, function and arguments to be invoked periodically.
      # This function must call :telemetry.execute/3 and a metric must be added above.
      # {ApiWeb, :count_users, []}
    ]
  end
end
