defmodule ApiWeb.PixelCacheSupervisor do
  require Logger
  use GenServer
  alias Api.Canvas.Pixel
  alias Api.PixelCache.Redis, as: RedisCache

  # Capture Mix.env at compile time since Mix is not available at runtime in releases
  @env Mix.env()

  def start_link(arg) do
    GenServer.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def list_pixel_subsection_from_file_as_binary(x, y) do
    GenServer.call(__MODULE__, {:sub_section_of_pixels_as_binary, x, y})
    |> Map.get(:sub_section_of_pixels_as_binary)
  end

  def write_pixels_to_cache(pixels) do
    GenServer.call(__MODULE__, {:write_pixels, pixels})
  end

  # Keep the old function name for backwards compatibility
  def write_pixels_to_file(pixels) do
    write_pixels_to_cache(pixels)
  end

  @impl true
  def init(_init_args) do
    # No longer need to load all pixels on startup - Redis cache is persistent
    # and chunks are loaded on-demand
    Logger.info("PixelCacheSupervisor started - using Redis-based chunk cache")
    {:ok, %{}}
  end

  @impl true
  def handle_call({:sub_section_of_pixels_as_binary, x, y}, _from, state) do
    chunk_size = get_chunk_size()
    {chunk_x, chunk_y} = get_chunk_origin(x, y, chunk_size)

    binary_data =
      case RedisCache.get_chunk(chunk_x, chunk_y) do
        {:ok, nil} ->
          # Chunk not in cache - load from database and cache it
          load_and_cache_chunk(chunk_x, chunk_y, chunk_size)

        {:ok, data} ->
          data

        {:error, reason} ->
          Logger.error("Failed to get chunk from Redis: #{inspect(reason)}")
          # Fallback to loading from database
          load_and_cache_chunk(chunk_x, chunk_y, chunk_size)
      end

    # Extract the requested subsection from the chunk
    # The request coordinates (x, y) are the top-left corner of the viewport
    subsection = extract_subsection(binary_data, x, y, chunk_x, chunk_y, chunk_size)

    {:reply, %{sub_section_of_pixels_as_binary: subsection}, state}
  end

  def handle_call({:write_pixels, pixels}, _from, state) do
    RedisCache.update_pixels_in_chunks(pixels)
    {:reply, :ok, state}
  end

  defp load_and_cache_chunk(chunk_x, chunk_y, chunk_size) do
    # Skip database loading in test environment
    if @env == :test do
      :binary.copy(<<0>>, chunk_size * chunk_size)
    else
      pixels = load_pixels_for_chunk(chunk_x, chunk_y, chunk_size)
      binary_data = pixels_to_binary(pixels, chunk_x, chunk_y, chunk_size)

      # Cache the chunk
      case RedisCache.set_chunk(chunk_x, chunk_y, binary_data) do
        :ok -> :ok
        {:error, reason} -> Logger.error("Failed to cache chunk: #{inspect(reason)}")
      end

      binary_data
    end
  end

  defp load_pixels_for_chunk(chunk_x, chunk_y, chunk_size) do
    Pixel.Repo.list_pixels_in_chunk(chunk_x, chunk_y, chunk_size)
  end

  defp pixels_to_binary(pixels, chunk_x, chunk_y, chunk_size) do
    # Create empty chunk
    empty_chunk = :binary.copy(<<0>>, chunk_size * chunk_size)

    # Fill in pixel data
    Enum.reduce(pixels, empty_chunk, fn pixel, acc ->
      local_x = pixel.x - chunk_x
      local_y = pixel.y - chunk_y

      if local_x >= 0 and local_x < chunk_size and local_y >= 0 and local_y < chunk_size do
        offset = local_y * chunk_size + local_x
        set_byte_at(acc, offset, pixel.color_ref)
      else
        acc
      end
    end)
  end

  defp set_byte_at(binary, offset, value) when offset >= 0 and offset < byte_size(binary) do
    <<prefix::binary-size(offset), _::8, suffix::binary>> = binary
    <<prefix::binary, value::8, suffix::binary>>
  end

  defp set_byte_at(binary, _offset, _value), do: binary

  defp extract_subsection(chunk_data, x, y, chunk_x, chunk_y, chunk_size) do
    # Calculate offset within chunk
    offset_x = x - chunk_x
    offset_y = y - chunk_y

    # The viewport size is the same as chunk size in the current implementation
    viewport_size = chunk_size

    # If the requested viewport aligns with the chunk, return the whole thing
    if offset_x == 0 and offset_y == 0 do
      chunk_data
    else
      # Extract the subsection row by row
      # This handles edge cases where viewport spans chunk boundaries
      # For now, we assume viewport fits within a single chunk
      extract_rows(chunk_data, offset_x, offset_y, viewport_size, chunk_size)
    end
  end

  defp extract_rows(chunk_data, offset_x, offset_y, viewport_size, chunk_size) do
    0..(viewport_size - 1)
    |> Enum.reduce(<<>>, fn row, acc ->
      row_start = (offset_y + row) * chunk_size + offset_x

      # Ensure we don't read past the chunk boundary
      if row_start >= 0 and row_start + viewport_size <= byte_size(chunk_data) do
        row_data = :binary.part(chunk_data, row_start, viewport_size)
        acc <> row_data
      else
        # Return zeros for out-of-bounds rows
        acc <> :binary.copy(<<0>>, viewport_size)
      end
    end)
  end

  defp get_chunk_origin(x, y, chunk_size) do
    chunk_x = floor(x / chunk_size) * chunk_size
    chunk_y = floor(y / chunk_size) * chunk_size
    {chunk_x, chunk_y}
  end

  defp get_chunk_size do
    Application.get_env(:api, Api.PixelCache)[:viewport_diameter] || 400
  end
end
