defmodule Api.PixelCache do
  def initialize_file() do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    matrix = for _ <- 0..max_y, do: for(_ <- 0..max_x, do: <<0>>)
    File.write(file_path, matrix)
  end

  defp write_coord(coord, file) do
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    negative_offset = trunc(max_x * (max_y / 2) + max_y / 2)
    offset = trunc(negative_offset + coord.x * max_y + coord.y)

    if(abs(coord.x) > max_x / 2 || abs(coord.y) > max_y / 2) do
      nil
    else
      case :file.position(file, offset) do
        {:ok, next} ->
          # IO.puts("seeked to #{next}")
          next

        {:error, reason} ->
          IO.puts("Error seeking to #{offset} with reason: #{reason}")

          IO.puts(
            "max x: #{max_x},max y: #{max_y}, negative_offset: #{negative_offset}, coord x: #{coord.x}, coord y: #{coord.y}"
          )
      end

      case :file.write(file, <<1>>) do
        :ok ->
          # IO.puts("wrote 1 @ #{offset}")
          nil

        {:error, reason} ->
          IO.puts("Error reading file: #{reason}")
      end
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
              # IO.inspect(i, label: "index")
              x = Integer.floor_div(i, max_x) - trunc(max_y / 2)
              y = Integer.mod(i, max_x) - trunc(max_y / 2)
              # IO.inspect(acc, label: "")
              # IO.puts("data: #{byte}, index: #{i}, x: #{x}, y: #{y}")
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
