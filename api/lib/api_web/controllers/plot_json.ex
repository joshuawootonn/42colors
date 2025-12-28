defmodule ApiWeb.PlotJSON do
  import Ecto.Query
  alias Api.Canvas.Plot
  alias Api.Repo

  @doc """
  Renders a list of plots.
  """
  def index(%{plots: plots}) do
    # Preload only username from users
    plots_with_users = Repo.preload(plots, user: username_query())
    %{data: for(plot <- plots_with_users, do: data(plot))}
  end

  @doc """
  Renders a single plot.
  """
  def show(%{plot: plot}) do
    # Preload only username from user
    plot_with_user = Repo.preload(plot, user: username_query())
    %{data: data(plot_with_user)}
  end

  # Query to select only the username field from users
  defp username_query do
    from u in Api.Accounts.User, select: %{id: u.id, username: u.username}
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

    # Get username from preloaded user association
    username =
      case plot.user do
        %Ecto.Association.NotLoaded{} -> nil
        nil -> nil
        user -> user.username
      end

    %{
      id: plot.id,
      name: plot.name,
      description: plot.description,
      userId: plot.user_id,
      username: username,
      insertedAt: plot.inserted_at,
      updatedAt: plot.updated_at,
      deletedAt: plot.deleted_at,
      polygon: polygon_data,
      score: plot.score
    }
  end
end
