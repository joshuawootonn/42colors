defmodule ApiWeb.PlotJSON do
  alias Api.Canvas.Plot

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
    polygon_data =
      case plot.polygon do
        nil ->
          nil

        polygon ->
          %{
            vertices: polygon.coordinates |> List.first() |> Enum.map(fn {x, y} -> [x, y] end)
          }
      end

    %{
      id: plot.id,
      name: plot.name,
      description: plot.description,
      userId: plot.user_id,
      insertedAt: plot.inserted_at,
      updatedAt: plot.updated_at,
      deletedAt: plot.deleted_at,
      polygon: polygon_data,
      score: plot.score
    }
  end
end
