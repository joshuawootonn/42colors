defmodule ApiWeb.RegionChannel do
  use Phoenix.Channel

  alias Api.Canvas

  def join("region:general", _message, socket) do
    {:ok, socket}
  end

  def handle_in("new_pixel", %{"body" => body}, socket) do
    Canvas.create_pixel(body)
    broadcast!(socket, "new_pixel", %{body: body})

    {:noreply, socket}
  end
end
