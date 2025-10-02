defmodule ApiWeb.LogJSON do
  alias Api.Logs.Log

  @doc """
  Renders a list of logs.
  """
  def index(%{logs: logs}) do
    %{data: for(log <- logs, do: data(log))}
  end

  @doc """
  Renders a single log.
  """
  def show(%{log: log}) do
    %{data: data(log)}
  end

  defp data(%Log{} = log) do
    %{
      id: log.id,
      userId: log.user_id,
      oldBalance: log.old_balance,
      newBalance: log.new_balance,
      logType: log.log_type,
      plotId: log.plot_id,
      diffs: log.diffs,
      insertedAt: log.inserted_at,
      updatedAt: log.updated_at,
      plot: render_plot(log.plot)
    }
  end

  defp render_plot(nil), do: nil

  defp render_plot(plot) do
    %{
      id: plot.id,
      name: plot.name,
      description: plot.description
    }
  end
end
