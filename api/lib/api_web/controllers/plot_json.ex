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
      insertedAt: plot.inserted_at,
      updatedAt: plot.updated_at,
      polygon: %{
        vertices: plot.polygon.coordinates |> List.first() |> Enum.map(fn {x, y} -> [x, y] end)
      }
    }
  end
end
