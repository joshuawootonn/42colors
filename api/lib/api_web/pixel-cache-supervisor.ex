defmodule ApiWeb.PixelCacheSupervisor do
  require Logger
  use GenServer
  alias ApiWeb.TelemetryHelper
  alias Api.Canvas.Pixel
  alias Api.PixelCache

  # Capture Mix.env at compile time since Mix is not available at runtime in releases
  @env Mix.env()

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

  @batch_size 100_000

  @impl true
  def init(_init_args) do
    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    # Skip loading pixels from DB in test environment to avoid sandbox issues
    unless @env == :test do
      spawn(fn -> load_and_write_pixels_in_batches(0, 0) end)
    end

    {:ok, %{}}
  end

  defp load_and_write_pixels_in_batches(offset, total_count) do
    batch = Pixel.Repo.list_pixels(limit: @batch_size, offset: offset)
    batch_size = length(batch)

    if batch_size > 0 do
      TelemetryHelper.instrument(:write_matrix_to_file, fn ->
        PixelCache.write_coordinates_to_file(batch)
      end)

      new_total = total_count + batch_size
      IO.puts("Processed batch: #{batch_size} pixels (total: #{new_total})")

      if batch_size == @batch_size do
        load_and_write_pixels_in_batches(offset + @batch_size, new_total)
      else
        IO.puts("Cache population complete: #{new_total} pixels")
        new_total
      end
    else
      IO.puts("Cache population complete: #{total_count} pixels")
      total_count
    end
  end

  @impl true
  def handle_call(:sub_section_of_pixels, _from, state) do
    sub_section_of_pixels = PixelCache.read_sub_section_of_file(%{x: 500, y: 500})

    {:reply, %{sub_section_of_pixels: sub_section_of_pixels}, state}
  end

  def handle_call({:sub_section_of_pixels_as_binary, x, y}, _from, state) do
    sub_section_of_pixels_as_binary =
      PixelCache.read_sub_section_of_file_as_binary(%{x: x, y: y})

    {:reply, %{sub_section_of_pixels_as_binary: sub_section_of_pixels_as_binary}, state}
  end

  def handle_call({:write_pixels, pixels}, _from, state) do
    TelemetryHelper.instrument(:write_matrix_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    {:reply, :ok, state}
  end
end
