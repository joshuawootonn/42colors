defmodule ApiWeb.PixelCacheSupervisor do
  require Logger
  use GenServer
  alias ApiWeb.TelemetryHelper
  alias Api.Canvas
  alias Api.PixelCache

  def start_link(arg) do
    GenServer.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def list_pixels_from_file() do
    GenServer.call(__MODULE__, :pixels)
    |> Map.get(:pixels)
  end

  def list_pixel_subsection_from_file do
    GenServer.call(__MODULE__, :sub_section_of_pixels)
    |> Map.get(:sub_section_of_pixels)
  end

  @impl true
  def init(_init_args) do
    pixels = Canvas.list_pixels()

    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    TelemetryHelper.instrument(:write_matrix_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    {:ok, %{}}
  end

  @impl true
  def handle_call(:pixels, _from, _) do
    pixels = PixelCache.read_sub_section_of_file()
    {:reply, %{pixels: pixels}, %{pixels: pixels}}
  end

  @impl true
  def handle_call(:sub_section_of_pixels, _from, _) do
    sub_section_of_pixels = PixelCache.read_sub_section_of_file(%{x: 500, y: 500})

    {:reply, %{sub_section_of_pixels: sub_section_of_pixels},
     %{sub_section_of_pixels: sub_section_of_pixels}}
  end
end
