defmodule ApiWeb.PlotController do
  use ApiWeb, :controller

  alias Api.Canvas.Plot
  alias Api.Canvas.ChunkUtils

  action_fallback ApiWeb.FallbackController

  @admin_emails ["jose56wonton@gmail.com", "anders.almberg@gmail.com", "joshuawootonn@gmail.com"]

  def index(conn, params) do
    case {Map.get(params, "x"), Map.get(params, "y")} do
      {nil, nil} ->
        # No x,y provided - return global list of plots with pagination
        limit_param = Map.get(params, "limit")
        order_by_param = Map.get(params, "order_by")
        starting_after_param = Map.get(params, "starting_after")

        list_opts =
          %{}
          |> maybe_add_limit(limit_param)
          |> maybe_add_order_by(order_by_param)
          |> maybe_add_starting_after(starting_after_param)

        {plots, has_more} = Plot.Service.list_plots(list_opts)
        render(conn, :index, plots: plots, has_more: has_more)

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
            render(conn, :index, plots: plots, has_more: false)

          _ ->
            conn
            |> put_status(:bad_request)
            |> json(%{error: "Invalid x,y coordinates. Must be integers."})
        end
    end
  end

  def me_plots(conn, params) do
    user = conn.assigns.current_user
    limit_param = Map.get(params, "limit")
    starting_after_param = Map.get(params, "starting_after")

    list_opts =
      %{}
      |> maybe_add_limit(limit_param)
      |> maybe_add_starting_after(starting_after_param)

    {plots, has_more} = Plot.Repo.list_user_plots(user.id, list_opts)
    render(conn, :index, plots: plots, has_more: has_more)
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

        case Plot.Service.create_plot(plot_params) do
          {:ok, %Plot{} = plot} ->
            # Broadcast to region channel
            plot_data = ApiWeb.PlotJSON.show(%{plot: plot}).data
            chunk_keys = ChunkUtils.get_affected_chunk_keys(plot.polygon)

            ApiWeb.Endpoint.broadcast("region:general", "create_plot", %{
              "plot" => plot_data,
              "chunk_keys" => chunk_keys
            })

            conn
            |> put_status(:created)
            |> render(:show, plot: plot)

          {:error, :overlapping_plots, overlapping_plots} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Plot overlaps with existing plots",
              overlapping_plots: format_overlapping_plots(overlapping_plots),
              errors: %{
                polygon: [
                  "Polygon overlaps with existing plots: #{format_overlapping_plots_names(overlapping_plots)}"
                ]
              }
            })

          {:error, :insufficient_balance} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Insufficient balance to create plot",
              errors: %{
                general: ["You don't have enough pixels to create a plot of this size"]
              }
            })

          {:error, :polygon_too_small} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Polygon must have an area of at least 1 pixel",
              errors: %{
                polygon: ["Polygon must have an area of at least 1 pixel"]
              }
            })

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

  def show(conn, %{"id" => id} = params) do
    include_deleted = Map.get(params, "include_deleted") == "true"

    if include_deleted do
      case Plot.Repo.get_plot_including_deleted(id) do
        nil -> send_resp(conn, :not_found, "Not found")
        plot -> render(conn, :show, plot: plot)
      end
    else
      try do
        plot = Plot.Repo.get_plot!(id)
        render(conn, :show, plot: plot)
      rescue
        Ecto.NoResultsError ->
          send_resp(conn, :not_found, "Not found")
      end
    end
  end

  def update(conn, %{"id" => id, "plot" => plot_params}) do
    user = conn.assigns.current_user
    is_admin = user.email in @admin_emails

    # Admin can edit any plot, regular users can only edit their own
    plot_result =
      if is_admin do
        Plot.Repo.get_plot!(id)
      else
        Plot.Repo.get_user_plot!(id, user.id)
      end

    case plot_result do
      nil ->
        send_resp(conn, :not_found, "Not found")

      plot ->
        # Handle polygon updates similar to create
        plot_params =
          case Map.get(plot_params, "polygon") do
            nil ->
              plot_params

            polygon ->
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
          end

        case Plot.Service.update_plot(plot, plot_params) do
          {:ok, %Plot{} = plot} ->
            # Broadcast to region channel
            plot_data = ApiWeb.PlotJSON.show(%{plot: plot}).data
            chunk_keys = ChunkUtils.get_affected_chunk_keys(plot.polygon)

            ApiWeb.Endpoint.broadcast("region:general", "update_plot", %{
              "plot" => plot_data,
              "chunk_keys" => chunk_keys
            })

            render(conn, :show, plot: plot)

          {:error, :overlapping_plots, overlapping_plots} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Plot overlaps with existing plots",
              overlapping_plots: format_overlapping_plots(overlapping_plots),
              errors: %{
                polygon: [
                  "Polygon overlaps with existing plots: #{format_overlapping_plots_names(overlapping_plots)}"
                ]
              }
            })

          {:error, :insufficient_balance} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Insufficient balance to update plot",
              errors: %{
                general: ["You don't have enough pixels to resize to this size"]
              }
            })

          {:error, :polygon_too_small} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              status: "error",
              message: "Polygon must have an area of at least 1 pixel",
              errors: %{
                polygon: ["Polygon must have an area of at least 1 pixel"]
              }
            })

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
    is_admin = user.email in @admin_emails

    # Admin can delete any plot, regular users can only delete their own
    plot_result =
      if is_admin do
        Plot.Repo.get_plot!(id)
      else
        Plot.Repo.get_user_plot!(id, user.id)
      end

    case plot_result do
      nil ->
        send_resp(conn, :not_found, "Not found")

      plot ->
        # Calculate chunk keys before deleting
        chunk_keys = ChunkUtils.get_affected_chunk_keys(plot.polygon)

        case Plot.Service.delete_plot(plot) do
          {:ok, %Plot{}} ->
            # Broadcast to region channel
            ApiWeb.Endpoint.broadcast("region:general", "delete_plot", %{
              "plot_id" => plot.id,
              "chunk_keys" => chunk_keys
            })

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

  defp format_overlapping_plots(overlapping_plots) do
    Enum.map(overlapping_plots, fn plot ->
      %{
        id: plot.id,
        name: plot.name,
        description: plot.description
      }
    end)
  end

  defp format_overlapping_plots_names(overlapping_plots) do
    overlapping_plots
    |> Enum.map(& &1.name)
    |> Enum.join(", ")
  end

  defp parse_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, :invalid_integer}
    end
  end

  defp parse_integer(_), do: {:error, :invalid_integer}

  defp parse_limit(nil), do: {:error, :no_limit}

  defp parse_limit(value) when is_binary(value) do
    case Integer.parse(value) do
      {limit, ""} when limit > 0 and limit <= 100 -> {:ok, limit}
      # Cap at max
      {limit, ""} when limit > 100 -> {:ok, 100}
      # Allow 0 for empty results
      {0, ""} -> {:ok, 0}
      _ -> {:error, :invalid_limit}
    end
  end

  defp parse_limit(_), do: {:error, :invalid_limit}

  defp maybe_add_limit(opts, nil), do: opts

  defp maybe_add_limit(opts, limit_param) do
    case parse_limit(limit_param) do
      {:ok, limit} -> Map.put(opts, :limit, limit)
      {:error, _} -> opts
    end
  end

  defp maybe_add_order_by(opts, nil), do: opts
  defp maybe_add_order_by(opts, "top"), do: Map.put(opts, :order_by, "top")
  defp maybe_add_order_by(opts, "recent"), do: Map.put(opts, :order_by, "recent")
  defp maybe_add_order_by(opts, _), do: opts

  defp maybe_add_starting_after(opts, nil), do: opts

  defp maybe_add_starting_after(opts, starting_after_param) do
    case parse_integer(starting_after_param) do
      {:ok, starting_after} -> Map.put(opts, :starting_after, starting_after)
      {:error, _} -> opts
    end
  end
end
