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

  def list_pixel_subsection_from_file_as_binary do
    GenServer.call(__MODULE__, :sub_section_of_pixels_as_binary)
    |> Map.get(:sub_section_of_pixels_as_binary)
  end

  def write_pixels_to_file(pixels) do
    GenServer.call(__MODULE__, {:write_pixels, pixels})
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

  @impl true
  def handle_call(:sub_section_of_pixels_as_binary, _from, _) do
    sub_section_of_pixels_as_binary =
      PixelCache.read_sub_section_of_file_as_binary(%{x: 500, y: 500})

    {:reply, %{sub_section_of_pixels_as_binary: sub_section_of_pixels_as_binary},
     %{sub_section_of_pixels_as_binary: sub_section_of_pixels_as_binary}}
  end

  @impl true
  def handle_call({:write_pixels, pixels}, _from, state) do
    TelemetryHelper.instrument(:write_matrix_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    # or you can return the updated state if necessary
    {:reply, :ok, state}
  end
end
