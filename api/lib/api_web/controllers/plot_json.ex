defmodule ApiWeb.PlotJSON do
  alias Api.Plots.Plot

  @doc """
  Renders a list of plots.
  """
  def index(%{plots: plots}) do
    %{data: for(plot <- plots, do: data(plot))}
  end

  @doc """
  Renders a single plot.
  """
  def show(%{plot: plot}) do
    %{data: data(plot)}
  end

  defp data(%Plot{} = plot) do
    %{
      id: plot.id,
      name: plot.name,
      description: plot.description,
      user_id: plot.user_id,
      inserted_at: plot.inserted_at,
      updated_at: plot.updated_at
    }
  end
end
