defmodule Api.PixelCache do
  def initialize_file() do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]

    size = max_x * max_y
    zeros = <<0::size(size)>>
    File.write(file_path, zeros)
  end

  defp write_coord(coord, file) do
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    negative_offset = trunc(max_x * (max_y / 2) + max_y / 2)
    offset = trunc(negative_offset + coord.y * max_x + coord.x)

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

    # opening in read + write mode prevent this thing from truncating the file
    file = File.open!(file_path, [:raw, :binary, :read, :write, :delayed_write])

    Enum.each(coordinates, fn coord -> write_coord(coord, file) end)
    File.close(file)
  end

  def read_sub_section_of_file(point) do
    file_path = Application.get_env(:api, PixelCache)[:pixel_cache_file_name]
    max_x = Application.get_env(:api, PixelCache)[:canvas_width]
    max_y = Application.get_env(:api, PixelCache)[:canvas_height]
    viewport_diameter = Application.get_env(:api, PixelCache)[:viewport_diameter]
    half_x = trunc(max_x / 2)
    half_y = trunc(max_y / 2)
    half_viewport = trunc(viewport_diameter / 2)
    negative_offset = trunc(max_x * half_viewport + half_viewport)

    absolute_point = %{x: point.x + half_x, y: point.y + half_y}
    absolute_position = absolute_point.x + absolute_point.y * max_x

    absolute_start_position = absolute_position - negative_offset

    file = File.open!(file_path, [:raw, :binary, :read])

    coords =
      0..viewport_diameter
      |> Enum.to_list()
      |> Enum.reduce([], fn j, acc ->
        absolute_start_position_of_row = absolute_start_position + max_x * j
        :file.position(file, absolute_start_position_of_row)

        y = Integer.floor_div(absolute_start_position_of_row, max_y) - trunc(max_y / 2)

        # IO.inspect(%{
        #   absolute_position: absolute_position,
        #   negative_offset: negative_offset,
        #   half_viewport: half_viewport,
        #   absolute_start_position: absolute_start_position,
        #   max_x: max_x,
        #   j: j,
        #   y: y,
        #   absolute_start_position_of_row: absolute_start_position_of_row,
        #   max_y: max_y
        # })

        coords =
          case IO.binread(file, viewport_diameter + 1) do
            :eof ->
              IO.puts("End of file reached, no more data to read.")
              []

            data when is_binary(data) ->
              :binary.bin_to_list(data)
              |> Enum.with_index()
              |> Enum.reduce([], fn {byte, i}, acc ->
                if byte != 0 do
                  # IO.inspect(i, label: "index")
                  x =
                    Integer.mod(absolute_start_position_of_row + i, max_x) -
                      trunc(max_y / 2)

                  # IO.inspect(acc, label: "")
                  # IO.puts("data: #{byte}, index: #{i}, x: #{x}, y: #{y}")
                  acc ++ [%{x: x, y: y}]
                else
                  acc
                end
              end)

            {:error, reason} ->
              IO.puts("Error reading file: #{reason}")
              []
          end

        acc ++ coords
      end)

    File.close(file)
    coords
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
              x = Integer.mod(i, max_x) - trunc(max_y / 2)
              y = Integer.floor_div(i, max_x) - trunc(max_y / 2)
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
