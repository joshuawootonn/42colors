defmodule ApiWeb.PixelSubSectionInFileAsBinary do
  use ApiWeb, :controller

  alias ApiWeb.TelemetryHelper
  alias ApiWeb.PixelCacheSupervisor
  alias Pixels

  def index(conn, _params) do
    x = String.to_integer(Map.get(conn.params, "x"))
    y = String.to_integer(Map.get(conn.params, "y"))

    pixels =
      TelemetryHelper.instrument(:list_pixel_subsection_from_file, fn ->
        PixelCacheSupervisor.list_pixel_subsection_from_file_as_binary(x, y)
      end)

    conn
    |> put_resp_content_type("application/octet-stream")
    |> send_resp(200, pixels)
  end
end
