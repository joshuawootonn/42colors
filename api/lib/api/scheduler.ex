defmodule Api.Scheduler do
  @moduledoc """
  Quantum scheduler for periodic jobs.
  Configured in config/config.exs.
  """
  use Quantum, otp_app: :api
end
