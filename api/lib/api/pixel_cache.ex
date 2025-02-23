defmodule Api.PixelCacheOptions do
  defstruct file_path: Application.compile_env(:api, Api.PixelCache)[:pixel_cache_file_name],
            canvas_width: Application.compile_env(:api, Api.PixelCache)[:canvas_width],
            canvas_height: Application.compile_env(:api, Api.PixelCache)[:canvas_height],
            viewport_diameter: Application.compile_env(:api, Api.PixelCache)[:viewport_diameter]
end

defmodule Api.PixelCache do
  def initialize_file(options \\ %Api.PixelCacheOptions{}) do
    size = options.canvas_width * options.canvas_height * 8
    zeros = <<0::size(size)>>

    File.write(options.file_path, zeros)
  end

  defp write_coord(coord, file, options \\ %Api.PixelCacheOptions{}) do
    canvas_width = options.canvas_width
    canvas_height = options.canvas_height

    negative_offset = trunc(canvas_width * (canvas_height / 2) + canvas_height / 2)
    offset = trunc(negative_offset + coord.y * canvas_width + coord.x)

    if(abs(coord.x) > canvas_width / 2 || abs(coord.y) > canvas_height / 2) do
      nil
    else
      case :file.position(file, offset) do
        {:ok, next} ->
          # IO.puts("seeked to #{next}")
          next

        {:error, reason} ->
          IO.puts("Error seeking to #{offset} with reason: #{reason}")

          IO.puts(
            "canvas_width: #{canvas_width},canvas_height: #{canvas_height}, negative_offset: #{negative_offset}, coord x: #{coord.x}, coord y: #{coord.y}"
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

  def write_coordinates_to_file(coordinates, options \\ %Api.PixelCacheOptions{}) do
    # opening in read + write mode prevent this thing from truncating the file
    file = File.open!(options.file_path, [:raw, :binary, :read, :write, :delayed_write])

    Enum.each(coordinates, fn coord -> write_coord(coord, file) end)
    File.close(file)
  end

  def read_sub_section_of_file(point, options \\ %Api.PixelCacheOptions{}) do
    canvas_width = options.canvas_width
    canvas_height = options.canvas_height
    viewport_diameter = options.viewport_diameter
    half_x = trunc(canvas_width / 2)
    half_y = trunc(canvas_height / 2)
    half_viewport = trunc(viewport_diameter / 2)
    negative_offset = trunc(canvas_width * half_viewport + half_viewport)

    absolute_point = %{x: point.x + half_x, y: point.y + half_y}
    absolute_position = absolute_point.x + absolute_point.y * canvas_width

    absolute_start_position = absolute_position - negative_offset

    file = File.open!(options.file_path, [:raw, :binary, :read])

    coords =
      0..viewport_diameter
      |> Enum.to_list()
      |> Enum.reduce([], fn j, acc ->
        absolute_start_position_of_row = absolute_start_position + canvas_width * j
        :file.position(file, absolute_start_position_of_row)

        y =
          Integer.floor_div(absolute_start_position_of_row, canvas_height) -
            trunc(canvas_height / 2)

        # IO.inspect(%{
        #   absolute_position: absolute_position,
        #   negative_offset: negative_offset,
        #   half_viewport: half_viewport,
        #   absolute_start_position: absolute_start_position,
        #   canvas_width: canvas_width,
        #   j: j,
        #   y: y,
        #   absolute_start_position_of_row: absolute_start_position_of_row,
        #   canvas_height: canvas_height
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
                    Integer.mod(absolute_start_position_of_row + i, canvas_width) -
                      trunc(canvas_height / 2)

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

  def read_sub_section_of_file_as_binary(point, options \\ %Api.PixelCacheOptions{}) do
    canvas_width = options.canvas_width
    canvas_height = options.canvas_height
    viewport_diameter = options.viewport_diameter
    half_x = trunc(canvas_width / 2)
    half_y = trunc(canvas_height / 2)
    half_viewport = trunc(viewport_diameter / 2)
    negative_offset = trunc(canvas_width * half_viewport + half_viewport)

    absolute_point = %{x: point.x + half_x, y: point.y + half_y}
    absolute_position = absolute_point.x + absolute_point.y * canvas_width

    absolute_start_position = absolute_position - negative_offset

    file = File.open!(options.file_path, [:raw, :binary, :read])

    matrix =
      0..viewport_diameter
      |> Enum.to_list()
      |> Enum.reduce(<<>>, fn j, acc ->
        absolute_start_position_of_row = absolute_start_position + canvas_width * j
        :file.position(file, absolute_start_position_of_row)

        # IO.inspect(%{
        #   absolute_position: absolute_position,
        #   negative_offset: negative_offset,
        #   half_viewport: half_viewport,
        #   absolute_start_position: absolute_start_position,
        #   canvas_width: canvas_width,
        #   j: j,
        #   y: y,
        #   absolute_start_position_of_row: absolute_start_position_of_row,
        #   canvas_height: canvas_height
        # })

        line =
          case IO.binread(file, viewport_diameter + 1) do
            :eof ->
              IO.puts("End of file reached, no more data to read.")
              <<>>

            data when is_binary(data) ->
              data

            {:error, reason} ->
              IO.puts("Error reading file: #{reason}")
              <<>>
          end

        acc <> line
      end)

    File.close(file)
    matrix
  end
end
