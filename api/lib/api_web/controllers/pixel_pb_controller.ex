defmodule ApiWeb.PixelProtobufController do
  use ApiWeb, :controller

  alias Api.Canvas
  alias Pixels

  def index(conn, _params) do
    pixels = Canvas.list_pixels()

    formatted_pixels = %Pixels{
      pixels:
        Enum.map(pixels, fn pixel ->
          %Pixel{x: pixel.x, y: pixel.y, color: 0, id: pixel.id}
        end)
    }

    IO.inspect(formatted_pixels)

    binary_pixels = Pixels.encode(formatted_pixels)
    and_back = Pixels.decode(binary_pixels)

    IO.inspect(and_back)
    # render(conn, :index, pixels: pixels)

    conn
    |> put_resp_content_type("application/octet-stream")
    |> send_resp(200, binary_pixels)
  end
end
