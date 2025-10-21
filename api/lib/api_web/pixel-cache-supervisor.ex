defmodule ApiWeb.PixelCacheSupervisor do
  require Logger
  use GenServer
  alias ApiWeb.TelemetryHelper
  alias Api.Canvas.Pixel
  alias Api.PixelCache

  def start_link(arg) do
    GenServer.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def list_pixel_subsection_from_file do
    GenServer.call(__MODULE__, :sub_section_of_pixels)
    |> Map.get(:sub_section_of_pixels)
  end

  def list_pixel_subsection_from_file_as_binary(x, y) do
    GenServer.call(__MODULE__, {:sub_section_of_pixels_as_binary, x, y})
    |> Map.get(:sub_section_of_pixels_as_binary)
  end

  def write_pixels_to_file(pixels) do
    GenServer.call(__MODULE__, {:write_pixels, pixels})
  end

  @impl true
  def init(_init_args) do
    pixels = Pixel.Repo.list_pixels()

    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    IO.puts("Writing #{pixels |> length} pixels to file")

    TelemetryHelper.instrument(:write_matrix_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    {:ok, %{}}
  end

  @impl true
  def handle_call(:sub_section_of_pixels, _from, _) do
    sub_section_of_pixels = PixelCache.read_sub_section_of_file(%{x: 500, y: 500})

    {:reply, %{sub_section_of_pixels: sub_section_of_pixels},
     %{sub_section_of_pixels: sub_section_of_pixels}}
  end

  @impl true
  def handle_call({:sub_section_of_pixels_as_binary, x, y}, _from, _) do
    sub_section_of_pixels_as_binary =
      PixelCache.read_sub_section_of_file_as_binary(%{x: x, y: y})

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
