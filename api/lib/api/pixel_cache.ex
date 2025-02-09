defmodule Api.PixelCache do
  def initialize_file() do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    matrix = for _ <- 0..max_y, do: for(_ <- 0..max_x, do: <<0>>)
    File.write(file_path, matrix)
  end

  defp write_coord(coord, file) do
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    offset = coord.x * max_y + coord.y
    {:ok, next} = :file.position(file, offset)

    case :file.write(file, <<1>>) do
      :ok ->
        IO.puts("wrote 1 @ #{next}")

      {:error, reason} ->
        IO.puts("Error reading file: #{reason}")
    end
  end

  def write_coordinates_to_file(coordinates) do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    IO.puts("File caching to #{file_path}")

    # opening in read + write mode prevent this thing from truncating the file
    file = File.open!(file_path, [:raw, :binary, :read, :write, :delayed_write])

    Enum.each(coordinates, fn coord -> write_coord(coord, file) end)
    File.close(file)
  end

  def read_sub_section_of_file() do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    start = 0
    file = File.open!(file_path, [:raw, :binary, :read])
    :file.position(file, start)

    length_of_file = max_x * max_y

    coords =
      case IO.binread(file, length_of_file) do
        :eof ->
          IO.puts("End of file reached, no more data to read.")

        data when is_binary(data) ->
          :binary.bin_to_list(data)
          |> Enum.with_index()
          |> Enum.reduce([], fn {byte, i}, acc ->
            if byte != 0 do
              x = Integer.floor_div(i, max_x)
              y = Integer.mod(i, max_x)
              IO.inspect(acc, label: "")
              IO.puts("data: #{byte}, position: #{i}, x: #{x}, y: #{y}")
              acc ++ [%{x: x, y: y}]
            else
              acc
            end
          end)

        {:error, reason} ->
          IO.puts("Error reading file: #{reason}")
      end

    File.close(file)
    coords
  end

  def read_sub_section_of_file_as_binary() do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    start = 0
    file = File.open!(file_path, [:raw, :binary, :read])
    :file.position(file, start)
    length_of_file = max_x * max_y

    coords =
      case IO.binread(file, length_of_file) do
        :eof ->
          IO.puts("End of file reached, no more data to read.")

        data when is_binary(data) ->
          data

        {:error, reason} ->
          IO.puts("Error reading file: #{reason}")
      end

    File.close(file)
    coords
  end
end
