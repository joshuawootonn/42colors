defmodule ApiWeb.PixelInMemoryController do
  use ApiWeb, :controller

  alias ApiWeb.PixelSupervisor
  alias ApiWeb.TelemetryHelper
  alias Pixels

  def index(conn, _params) do
    pixels = PixelSupervisor.list_pixels()

    formatted_pixels =
      TelemetryHelper.instrument(:format_pixels, fn ->
        %Pixels{
          pixels:
            Enum.map(pixels, fn pixel ->
              %Pixel{x: pixel.x, y: pixel.y, color: 0, id: pixel.id}
            end)
        }
      end)

    binary_pixels =
      TelemetryHelper.instrument(:encode_pixels, fn -> Pixels.encode(formatted_pixels) end)

    conn
    |> put_resp_content_type("application/octet-stream")
    |> send_resp(200, binary_pixels)
  end
end
