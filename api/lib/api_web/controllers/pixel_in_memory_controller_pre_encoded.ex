defmodule ApiWeb.PixelInMemoryControllerPreEncoded do
  use ApiWeb, :controller

  alias ApiWeb.PixelSupervisor
  alias Pixels

  def index(conn, _params) do
    pixels = PixelSupervisor.list_encoded_pixels()

    conn
    |> put_resp_content_type("application/octet-stream")
    |> send_resp(200, pixels)
  end
end
