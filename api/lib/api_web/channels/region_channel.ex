defmodule ApiWeb.RegionChannel do
  use Phoenix.Channel

  alias Api.Canvas
  alias ApiWeb.PixelCacheSupervisor

  def join("region:general", _message, socket) do
    {:ok, socket}
  end

  def handle_in("new_pixels", %{"pixels" => pixels, "store_id" => store_id}, socket) do
    current_user_id = Map.get(socket.assigns, :current_user_id)

    if current_user_id == nil do
      {:reply, {:error, "unauthed_user"}, socket}
    else
      {:ok, pixel_changsets} =
        Canvas.create_many_pixels(
          Enum.map(pixels, fn pixel ->
            %{
              x: Map.get(pixel, "x"),
              y: Map.get(pixel, "y"),
              color: Map.get(pixel, "color"),
              user_id: current_user_id
            }
          end)
        )

      PixelCacheSupervisor.write_pixels_to_file(pixel_changsets)

      broadcast!(socket, "new_pixels", %{pixels: pixels, store_id: store_id})

      {:noreply, socket}
    end
  end
end
