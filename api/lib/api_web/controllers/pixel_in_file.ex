defmodule ApiWeb.PixelInFile do
  use ApiWeb, :controller

  alias ApiWeb.TelemetryHelper
  alias ApiWeb.PixelCacheSupervisor
  alias Pixels

  def index(conn, _params) do
    pixels =
      TelemetryHelper.instrument(:list_pixels_from_file, fn ->
        PixelCacheSupervisor.list_pixels_from_file()
      end)

    render(conn, :index, pixels: pixels)
  end
end
