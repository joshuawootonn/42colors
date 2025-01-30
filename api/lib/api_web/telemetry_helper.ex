defmodule ApiWeb.TelemetryHelper do
  require Logger

  def instrument(action_name, fun) do
    start_time = System.monotonic_time()

    result = fun.()

    duration = System.monotonic_time() - start_time

    :telemetry.execute([:my_app, :action, action_name], %{duration: duration})

    result
  end

  def handle_event(event_name, measurements, _metadata, _config) do
    duration = measurements[:duration]
    Logger.debug("#{List.last(event_name)} completed in #{duration / 1_000_000} ms")
  end
end
