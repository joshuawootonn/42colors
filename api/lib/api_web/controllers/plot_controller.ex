defmodule ApiWeb.PlotController do
  use ApiWeb, :controller

  alias Api.Canvas.Plot

  action_fallback ApiWeb.FallbackController

  def index(conn, params) do
    case {Map.get(params, "x"), Map.get(params, "y")} do
      {nil, _} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "x and y query parameters are required"})

      {_, nil} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "x and y query parameters are required"})

      {x_str, y_str} ->
        case {parse_integer(x_str), parse_integer(y_str)} do
          {{:ok, x}, {:ok, y}} ->
            plots = Plot.Service.list_plots_by_chunk(x, y)
            render(conn, :index, plots: plots)

          _ ->
            conn
            |> put_status(:bad_request)
            |> json(%{error: "Invalid x,y coordinates. Must be integers."})
        end
    end
  end

  def me_plots(conn, _params) do
    user = conn.assigns.current_user
    plots = Plot.Repo.list_user_plots(user.id)
    render(conn, :index, plots: plots)
  end

  def create(conn, %{"plot" => plot_params}) do
    user = conn.assigns.current_user
    plot_params = Map.put(plot_params, "user_id", user.id)

    case Map.get(plot_params, "polygon") do
      nil ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "polygon is required"})

      polygon ->
        plot_params =
          Map.put(plot_params, "polygon", %Geo.Polygon{
            coordinates: [
              polygon
              |> Map.get("vertices", [])
              |> Enum.map(fn vertex ->
                # Convert coordinates to numeric coordinate tuple
                {List.first(vertex), List.last(vertex)}
              end)
            ],
            srid: 4326
          })

        case Plot.Repo.create_plot(plot_params) do
          {:ok, %Plot{} = plot} ->
            conn
            |> put_status(:created)
            |> render(:show, plot: plot)

          {:error, %Ecto.Changeset{} = changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Plot creation failed",
              errors: format_changeset_errors(changeset)
            })
        end
    end
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Plot.Repo.get_user_plot!(id, user.id) do
      nil ->
        send_resp(conn, :not_found, "Not found")

      plot ->
        render(conn, :show, plot: plot)
    end
  end

  def update(conn, %{"id" => id, "plot" => plot_params}) do
    user = conn.assigns.current_user

    case Plot.Repo.get_user_plot!(id, user.id) do
      nil ->
        send_resp(conn, :not_found, "Not found")

      plot ->
        case Plot.Repo.update_plot(plot, plot_params) do
          {:ok, %Plot{} = plot} ->
            render(conn, :show, plot: plot)

          {:error, %Ecto.Changeset{} = changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Plot update failed",
              errors: format_changeset_errors(changeset)
            })
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Plot.Repo.get_user_plot!(id, user.id) do
      nil ->
        send_resp(conn, :not_found, "Not found")

      plot ->
        case Plot.Repo.delete_plot(plot) do
          {:ok, %Plot{}} ->
            send_resp(conn, :no_content, "")

          {:error, %Ecto.Changeset{} = changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Plot deletion failed",
              errors: format_changeset_errors(changeset)
            })
        end
    end
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end

  defp parse_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, :invalid_integer}
    end
  end

  defp parse_integer(_), do: {:error, :invalid_integer}
end
