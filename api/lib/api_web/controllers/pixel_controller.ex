defmodule ApiWeb.PixelController do
  use ApiWeb, :controller

  alias Api.Canvas
  alias Api.Canvas.Pixel

  action_fallback ApiWeb.FallbackController

  def index(conn, _params) do
    pixels = Canvas.list_pixels()
    render(conn, :index, pixels: pixels)
  end

  def show(conn, %{"id" => id}) do
    pixel = Canvas.get_pixel!(id)
    render(conn, :show, pixel: pixel)
  end

  def delete(conn, %{"id" => id}) do
    pixel = Canvas.get_pixel!(id)

    with {:ok, %Pixel{}} <- Canvas.delete_pixel(pixel) do
      send_resp(conn, :no_content, "")
    end
  end
end
