defmodule ApiWeb.RegionChannel do
  use Phoenix.Channel

  alias Api.Canvas.PixelService
  alias ApiWeb.PixelCacheSupervisor

  def join("region:general", _message, socket) do
    {:ok, socket}
  end

  def handle_in("new_pixels", %{"pixels" => pixels, "store_id" => store_id}, socket) do
    current_user_id = Map.get(socket.assigns, :current_user_id)

    if current_user_id == nil do
      # Allow unauthenticated users to draw; pixels will be saved without user association
      # and only outside others' plots (handled in service layer)
      # Transform pixels to the format expected by PixelService
      pixel_attrs =
        Enum.map(pixels, fn pixel ->
          %{
            x: Map.get(pixel, "x"),
            y: Map.get(pixel, "y"),
            color: Map.get(pixel, "color")
          }
        end)

      case PixelService.create_many(pixel_attrs, nil) do
        {:ok, pixel_changesets} ->
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p -> %{"x" => p.x, "y" => p.y, "color" => p.color} end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})
          {:noreply, socket}

        {:ok, pixel_changesets, _invalid_pixels} ->
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p -> %{"x" => p.x, "y" => p.y, "color" => p.color} end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})
          {:noreply, socket}

        {:error, :invalid_arguments} ->
          {:reply, {:error, "invalid_arguments"}, socket}

        {:error, reason} ->
          {:reply, {:error, to_string(reason)}, socket}
      end
    else
      # Transform pixels to the format expected by PixelService
      pixel_attrs =
        Enum.map(pixels, fn pixel ->
          %{
            x: Map.get(pixel, "x"),
            y: Map.get(pixel, "y"),
            color: Map.get(pixel, "color")
          }
        end)

      case PixelService.create_many(pixel_attrs, current_user_id) do
        {:ok, pixel_changesets} ->
          # All pixels were valid and created
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p -> %{"x" => p.x, "y" => p.y, "color" => p.color} end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})
          {:noreply, socket}

        {:ok, pixel_changesets, invalid_pixels} ->
          # Some pixels were valid and created, some were invalid
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          # Only broadcast the valid pixels that were actually created
          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p -> %{"x" => p.x, "y" => p.y, "color" => p.color} end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})

          {:reply,
           {:ok,
            %{
              created: length(pixel_changesets),
              rejected: length(invalid_pixels),
              invalid_pixels: invalid_pixels
            }}, socket}

        {:error, :all_invalid, invalid_pixels} ->
          {:reply,
           {:error, %{message: "all_pixels_outside_plots", invalid_pixels: invalid_pixels}},
           socket}

        {:error, :invalid_arguments} ->
          {:reply, {:error, "invalid_arguments"}, socket}

        {:error, changeset} ->
          {:reply, {:error, %{message: "validation_failed", errors: changeset.errors}}, socket}
      end
    end
  end

  def handle_info(
        %Phoenix.Socket.Broadcast{event: "create_plot", payload: %{"plot" => plot}},
        socket
      ) do
    push(socket, "create_plot", %{"plot" => plot})
    {:noreply, socket}
  end

  def handle_info(
        %Phoenix.Socket.Broadcast{event: "update_plot", payload: %{"plot" => plot}},
        socket
      ) do
    push(socket, "update_plot", %{"plot" => plot})
    {:noreply, socket}
  end

  def handle_info(
        %Phoenix.Socket.Broadcast{event: "delete_plot", payload: %{"plot_id" => plot_id}},
        socket
      ) do
    push(socket, "delete_plot", %{"plot_id" => plot_id})
    {:noreply, socket}
  end

  def handle_out(event, payload, socket) do
    push(socket, event, payload)
    {:noreply, socket}
  end
end
