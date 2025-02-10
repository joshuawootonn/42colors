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
    [
      # Phoenix Metrics
      # summary("phoenix.endpoint.start.system_time",
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.endpoint.stop.duration",
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.router_dispatch.start.system_time",
      #   tags: [:route],
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.router_dispatch.exception.duration",
      #   tags: [:route],
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.router_dispatch.stop.duration",
      #   tags: [:route],
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.socket_connected.duration",
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.channel_joined.duration",
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.channel_handled_in.duration",
      #   tags: [:event],
      #   unit: {:native, :millisecond}
      # ),
      #
      # # Database Metrics
      # summary("api.repo.query.total_time",
      #   unit: {:native, :millisecond},
      #   description: "The sum of the other measurements"
      # ),
      # summary("api.repo.query.decode_time",
      #   unit: {:native, :millisecond},
      #   description: "The time spent decoding the data received from the database"
      # ),
      # summary("api.repo.query.query_time",
      #   unit: {:native, :millisecond},
      #   description: "The time spent executing the query"
      # ),
      # summary("api.repo.query.queue_time",
      #   unit: {:native, :millisecond},
      #   description: "The time spent waiting for a database connection"
      # ),
      # summary("api.repo.query.idle_time",
      #   unit: {:native, :millisecond},
      #   description:
      #     "The time the connection spent waiting before being checked out for the query"
      # ),
      #
      # # VM Metrics
      # summary("vm.memory.total", unit: {:byte, :kilobyte}),
      # summary("vm.total_run_queue_lengths.total"),
      # summary("vm.total_run_queue_lengths.cpu"),
      # summary("vm.total_run_queue_lengths.io")
    ]
  end

  defp periodic_measurements do
    [
      # A module, function and arguments to be invoked periodically.
      # This function must call :telemetry.execute/3 and a metric must be added above.
      # {ApiWeb, :count_users, []}
    ]
  end
end
