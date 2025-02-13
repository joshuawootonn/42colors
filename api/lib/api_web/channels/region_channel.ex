defmodule ApiWeb.RegionChannel do
  use Phoenix.Channel

  alias Api.Canvas
  alias ApiWeb.PixelCacheSupervisor

  def join("region:general", _message, socket) do
    {:ok, socket}
  end

  def handle_in("new_pixel", %{"body" => body}, socket) do
    {:ok, pixel} = Canvas.create_pixel(body)

    PixelCacheSupervisor.write_pixels_to_file([
      pixel
    ])

    broadcast!(socket, "new_pixel", %{body: body})

    {:noreply, socket}
  end
end
