defmodule ApiWeb.PixelController do
  use ApiWeb, :controller

  alias Api.Canvas
  alias Api.Canvas.Pixel

  action_fallback ApiWeb.FallbackController

  def index(conn, _params) do
    pixels = Canvas.list_pixels()
    render(conn, :index, pixels: pixels)
  end

  def create(conn, %{"pixel" => pixel_params}) do
    with {:ok, %Pixel{} = pixel} <- Canvas.create_pixel(pixel_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/pixels/#{pixel}")
      |> render(:show, pixel: pixel)
    end
  end

  def show(conn, %{"id" => id}) do
    pixel = Canvas.get_pixel!(id)
    render(conn, :show, pixel: pixel)
  end

  def update(conn, %{"id" => id, "pixel" => pixel_params}) do
    pixel = Canvas.get_pixel!(id)

    with {:ok, %Pixel{} = pixel} <- Canvas.update_pixel(pixel, pixel_params) do
      render(conn, :show, pixel: pixel)
    end
  end

  def delete(conn, %{"id" => id}) do
    pixel = Canvas.get_pixel!(id)

    with {:ok, %Pixel{}} <- Canvas.delete_pixel(pixel) do
      send_resp(conn, :no_content, "")
    end
  end
end
