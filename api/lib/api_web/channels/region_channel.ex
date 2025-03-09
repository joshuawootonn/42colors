defmodule ApiWeb.RegionChannel do
  use Phoenix.Channel

  alias Api.Canvas
  alias ApiWeb.PixelCacheSupervisor

  def join("region:general", _message, socket) do
    {:ok, socket}
  end

  def handle_in("new_pixel", %{"body" => body}, socket) do
    current_user_id = Map.get(socket.assigns, :current_user_id)

    if current_user_id == nil do
      {:reply, {:error, "unauthed_user"}, socket}
    else
      {:ok, pixel} =
        Canvas.create_pixel(%{
          x: Map.get(body, "x"),
          y: Map.get(body, "y"),
          user_id: current_user_id
        })

      PixelCacheSupervisor.write_pixels_to_file([
        pixel
      ])

      broadcast!(socket, "new_pixel", %{body: body})

      {:noreply, socket}
    end
  end
end
