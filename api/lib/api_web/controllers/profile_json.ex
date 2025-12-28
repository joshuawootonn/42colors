defmodule ApiWeb.ProfileJSON do
  alias Api.Accounts.User
  alias Api.Canvas.Plot

  def show(%{user: user}) do
    %{data: user_data(user)}
  end

  def show_plots(%{plots: plots}) do
    %{data: Enum.map(plots, &plot_data/1)}
  end

  defp user_data(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      insertedAt: user.inserted_at
    }
  end

  defp plot_data(%Plot{} = plot) do
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
      insertedAt: plot.inserted_at,
      updatedAt: plot.updated_at,
      polygon: polygon_data,
      score: plot.score
    }
  end
end
