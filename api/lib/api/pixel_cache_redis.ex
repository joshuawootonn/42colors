defmodule Api.PixelCache.Redis do
  @moduledoc """
  Redis-based pixel cache for storing and retrieving chunk data.

  Each chunk is stored as a binary blob in Redis with the key format:
  "chunk:{x}:{y}" where x,y are the chunk origin coordinates.

  The binary format is a flat array of color_ref values (1 byte each) for
  the entire chunk, stored row by row. A value of 0 means no pixel at that position.
  """

  use GenServer
  require Logger
  alias Api.Canvas.ChunkUtils

  @chunk_key_prefix "chunk"

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    config = Application.get_env(:api, __MODULE__) || []
    {:ok, conn} = connect(config)
    {:ok, %{conn: conn}}
  end

  defp connect(config) do
    case Keyword.get(config, :url) do
      nil ->
        host = Keyword.get(config, :host, "localhost")
        port = Keyword.get(config, :port, 6379)
        database = Keyword.get(config, :database, 0)
        Redix.start_link(host: host, port: port, database: database)

      url ->
        Redix.start_link(url)
    end
  end

  def get_chunk(x, y) do
    GenServer.call(__MODULE__, {:get_chunk, x, y})
  end

  def set_chunk(x, y, binary_data) do
    GenServer.call(__MODULE__, {:set_chunk, x, y, binary_data})
  end

  def update_pixels_in_chunks(pixels) do
    GenServer.call(__MODULE__, {:update_pixels, pixels})
  end

  def clear_all_chunks do
    GenServer.call(__MODULE__, :clear_all)
  end

  def chunk_exists?(x, y) do
    GenServer.call(__MODULE__, {:chunk_exists, x, y})
  end

  @impl true
  def handle_call({:get_chunk, x, y}, _from, %{conn: conn} = state) do
    key = chunk_key(x, y)

    result =
      case Redix.command(conn, ["GET", key]) do
        {:ok, nil} -> {:ok, nil}
        {:ok, data} -> {:ok, data}
        {:error, reason} -> {:error, reason}
      end

    {:reply, result, state}
  end

  def handle_call({:set_chunk, x, y, binary_data}, _from, %{conn: conn} = state) do
    key = chunk_key(x, y)

    result =
      case Redix.command(conn, ["SET", key, binary_data]) do
        {:ok, "OK"} -> :ok
        {:error, reason} -> {:error, reason}
      end

    {:reply, result, state}
  end

  def handle_call({:update_pixels, pixels}, _from, %{conn: conn} = state) do
    chunk_size = ChunkUtils.chunk_length()

    # Group pixels by their chunk
    pixels_by_chunk =
      Enum.group_by(pixels, fn pixel ->
        ChunkUtils.get_chunk_origin(pixel.x, pixel.y)
      end)

    results =
      Enum.map(pixels_by_chunk, fn {{chunk_x, chunk_y}, chunk_pixels} ->
        update_single_chunk(conn, chunk_x, chunk_y, chunk_pixels, chunk_size)
      end)

    # Check if all updates succeeded
    case Enum.find(results, fn result -> result != :ok end) do
      nil -> {:reply, :ok, state}
      error -> {:reply, error, state}
    end
  end

  def handle_call(:clear_all, _from, %{conn: conn} = state) do
    result =
      case Redix.command(conn, ["KEYS", "#{@chunk_key_prefix}:*"]) do
        {:ok, []} ->
          :ok

        {:ok, keys} ->
          case Redix.command(conn, ["DEL" | keys]) do
            {:ok, _count} -> :ok
            {:error, reason} -> {:error, reason}
          end

        {:error, reason} ->
          {:error, reason}
      end

    {:reply, result, state}
  end

  def handle_call({:chunk_exists, x, y}, _from, %{conn: conn} = state) do
    key = chunk_key(x, y)

    result =
      case Redix.command(conn, ["EXISTS", key]) do
        {:ok, 1} -> true
        {:ok, 0} -> false
        {:error, _reason} -> false
      end

    {:reply, result, state}
  end

  defp update_single_chunk(conn, chunk_x, chunk_y, pixels, chunk_size) do
    key = chunk_key(chunk_x, chunk_y)

    # Get existing chunk data or create empty chunk
    chunk_data =
      case Redix.command(conn, ["GET", key]) do
        {:ok, nil} ->
          # Initialize empty chunk (all zeros)
          :binary.copy(<<0>>, chunk_size * chunk_size)

        {:ok, data} ->
          data

        {:error, reason} ->
          Logger.error("Failed to get chunk #{key}: #{inspect(reason)}")
          :binary.copy(<<0>>, chunk_size * chunk_size)
      end

    # Update the chunk with new pixel values
    updated_chunk =
      Enum.reduce(pixels, chunk_data, fn pixel, acc ->
        # Calculate position within chunk
        local_x = pixel.x - chunk_x
        local_y = pixel.y - chunk_y

        if local_x >= 0 and local_x < chunk_size and local_y >= 0 and local_y < chunk_size do
          offset = local_y * chunk_size + local_x
          set_byte_at(acc, offset, pixel.color_ref)
        else
          acc
        end
      end)

    # Save updated chunk
    case Redix.command(conn, ["SET", key, updated_chunk]) do
      {:ok, "OK"} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp set_byte_at(binary, offset, value) when offset >= 0 and offset < byte_size(binary) do
    <<prefix::binary-size(offset), _::8, suffix::binary>> = binary
    <<prefix::binary, value::8, suffix::binary>>
  end

  defp set_byte_at(binary, _offset, _value), do: binary

  defp chunk_key(x, y) do
    "#{@chunk_key_prefix}:#{x}:#{y}"
  end
end
