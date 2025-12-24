defmodule ApiWeb.RegionChannel do
  use Phoenix.Channel

  alias Api.Accounts.User
  alias Api.Canvas.ChunkUtils
  alias Api.Canvas.PixelService
  alias Api.Repo
  alias ApiWeb.PixelCacheSupervisor

  @admin_emails ["jose56wonton@gmail.com", "anders.almberg@gmail.com", "joshuawootonn@gmail.com"]

  # Intercept these events so we can filter them by subscribed chunks in handle_out
  intercept ["new_pixels", "create_plot", "update_plot", "delete_plot"]

  def join("region:general", _message, socket) do
    {:ok, assign(socket, :subscribed_chunks, MapSet.new())}
  end

  def handle_in("subscribe_chunks", %{"chunk_keys" => chunk_keys}, socket) when is_list(chunk_keys) do
    current_chunks = socket.assigns.subscribed_chunks
    new_chunks = MapSet.union(current_chunks, MapSet.new(chunk_keys))
    {:reply, {:ok, %{subscribed: chunk_keys}}, assign(socket, :subscribed_chunks, new_chunks)}
  end

  def handle_in("unsubscribe_chunks", %{"chunk_keys" => chunk_keys}, socket) when is_list(chunk_keys) do
    current_chunks = socket.assigns.subscribed_chunks
    new_chunks = MapSet.difference(current_chunks, MapSet.new(chunk_keys))
    {:reply, {:ok, %{unsubscribed: chunk_keys}}, assign(socket, :subscribed_chunks, new_chunks)}
  end

  def handle_in("new_pixels", %{"pixels" => pixels, "store_id" => store_id} = payload, socket) do
    current_user_id = Map.get(socket.assigns, :current_user_id)
    admin_override = Map.get(payload, "admin_override", false)

    if current_user_id == nil do
      # Allow unauthenticated users to draw; pixels will be saved without user association
      # and only outside others' plots (handled in service layer)
      # Transform pixels to the format expected by PixelService
      pixel_attrs =
        Enum.map(pixels, fn pixel ->
          %{
            x: Map.get(pixel, "x"),
            y: Map.get(pixel, "y"),
            color_ref: Map.get(pixel, "color_ref")
          }
        end)

      case PixelService.create_many(pixel_attrs, nil, skip_plot_validation: false) do
        {:ok, pixel_changesets} ->
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p ->
              %{"x" => p.x, "y" => p.y, "color_ref" => p.color_ref}
            end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})
          {:noreply, socket}

        {:ok, pixel_changesets, invalid_pixels, rejected_plot_ids} ->
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p ->
              %{"x" => p.x, "y" => p.y, "color_ref" => p.color_ref}
            end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})

          action_id = Map.get(payload, "action_id")

          {:reply,
           {:error,
            %{
              error_code: "prohibited_pixels",
              action_id: action_id,
              rejected_pixels: invalid_pixels,
              rejected_plot_ids: rejected_plot_ids,
              message: "Some pixels were rejected because they were within someone else's plot"
            }}, socket}

        {:error, :all_invalid, invalid_pixels, rejected_plot_ids} ->
          action_id = Map.get(payload, "action_id")

          {:reply,
           {:error,
            %{
              error_code: "prohibited_pixels",
              action_id: action_id,
              rejected_pixels: invalid_pixels,
              rejected_plot_ids: rejected_plot_ids,
              message: "All pixels were rejected because they were within someone else's plot"
            }}, socket}

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
            color_ref: Map.get(pixel, "color_ref")
          }
        end)

      # Check if admin override is valid (user must be an admin)
      is_admin_override_valid =
        admin_override && current_user_id != nil &&
          case Repo.get(User, current_user_id) do
            nil -> false
            user -> user.email in @admin_emails
          end

      case PixelService.create_many(pixel_attrs, current_user_id,
             skip_plot_validation: is_admin_override_valid
           ) do
        {:ok, pixel_changesets} ->
          # All pixels were valid and created
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p ->
              %{"x" => p.x, "y" => p.y, "color_ref" => p.color_ref}
            end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})
          {:noreply, socket}

        {:ok, pixel_changesets, invalid_pixels, rejected_plot_ids} ->
          # Some pixels were valid and created, some were invalid due to being in other users' plots
          PixelCacheSupervisor.write_pixels_to_file(pixel_changesets)

          # Only broadcast the valid pixels that were actually created
          valid_pixel_coords =
            Enum.map(pixel_changesets, fn p ->
              %{"x" => p.x, "y" => p.y, "color_ref" => p.color_ref}
            end)

          broadcast!(socket, "new_pixels", %{pixels: valid_pixel_coords, store_id: store_id})

          action_id = Map.get(payload, "action_id")

          {:reply,
           {:error,
            %{
              error_code: "prohibited_pixels",
              action_id: action_id,
              rejected_pixels: invalid_pixels,
              rejected_plot_ids: rejected_plot_ids,
              message: "Some pixels were rejected because they were within someone else's plot"
            }}, socket}

        {:error, :all_invalid, invalid_pixels, rejected_plot_ids} ->
          action_id = Map.get(payload, "action_id")

          {:reply,
           {:error,
            %{
              error_code: "prohibited_pixels",
              action_id: action_id,
              rejected_pixels: invalid_pixels,
              rejected_plot_ids: rejected_plot_ids,
              message: "All pixels were rejected because they were within someone else's plot"
            }}, socket}

        {:error, :invalid_arguments} ->
          {:reply, {:error, "invalid_arguments"}, socket}

        {:error, changeset} ->
          {:reply, {:error, %{message: "validation_failed", errors: changeset.errors}}, socket}
      end
    end
  end


  def handle_out("new_pixels", %{pixels: pixels, store_id: store_id}, socket) do
    subscribed_chunks = socket.assigns.subscribed_chunks

    # Filter pixels to only those in subscribed chunks
    filtered_pixels =
      Enum.filter(pixels, fn pixel ->
        chunk_key = ChunkUtils.get_chunk_key(pixel["x"], pixel["y"])
        MapSet.member?(subscribed_chunks, chunk_key)
      end)

    if Enum.empty?(filtered_pixels) do
      {:noreply, socket}
    else
      push(socket, "new_pixels", %{pixels: filtered_pixels, store_id: store_id})
      {:noreply, socket}
    end
  end

  def handle_out("create_plot", %{"plot" => plot, "chunk_keys" => chunk_keys}, socket) do
    subscribed_chunks = socket.assigns.subscribed_chunks

    # Check if any of the plot's chunks are subscribed
    relevant_chunk_keys =
      Enum.filter(chunk_keys, fn chunk_key ->
        MapSet.member?(subscribed_chunks, chunk_key)
      end)

    if Enum.empty?(relevant_chunk_keys) do
      {:noreply, socket}
    else
      push(socket, "create_plot", %{"plot" => plot, "chunk_keys" => relevant_chunk_keys})
      {:noreply, socket}
    end
  end

  def handle_out("update_plot", %{"plot" => plot, "chunk_keys" => chunk_keys}, socket) do
    subscribed_chunks = socket.assigns.subscribed_chunks

    relevant_chunk_keys =
      Enum.filter(chunk_keys, fn chunk_key ->
        MapSet.member?(subscribed_chunks, chunk_key)
      end)

    if Enum.empty?(relevant_chunk_keys) do
      {:noreply, socket}
    else
      push(socket, "update_plot", %{"plot" => plot, "chunk_keys" => relevant_chunk_keys})
      {:noreply, socket}
    end
  end

  def handle_out("delete_plot", %{"plot_id" => plot_id, "chunk_keys" => chunk_keys}, socket) do
    subscribed_chunks = socket.assigns.subscribed_chunks

    relevant_chunk_keys =
      Enum.filter(chunk_keys, fn chunk_key ->
        MapSet.member?(subscribed_chunks, chunk_key)
      end)

    if Enum.empty?(relevant_chunk_keys) do
      {:noreply, socket}
    else
      push(socket, "delete_plot", %{"plot_id" => plot_id, "chunk_keys" => relevant_chunk_keys})
      {:noreply, socket}
    end
  end

  def handle_out(event, payload, socket) do
    push(socket, event, payload)
    {:noreply, socket}
  end
end
