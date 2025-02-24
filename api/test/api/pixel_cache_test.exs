ExUnit.start()

defmodule AssertionTest do
  use ExUnit.Case, async: false
  alias Api.PixelCache
  alias Api.Repo

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})
  end

  describe "initialize_file" do
    test "happy path" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file()
      result = File.read!(file_path)
      assert byte_size(result) == 100
    end

    test "happy path with different dimensions" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file(%Api.PixelCacheOptions{canvas_width: 100, canvas_height: 100})
      result = File.read!(file_path)
      assert byte_size(result) == 10000
    end
  end

  describe "write_coordinates_to_file" do
    test "positive numbers" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file()

      initial_list = [
        %{x: 1, y: 1},
        %{x: 2, y: 2},
        %{x: 3, y: 3},
        %{x: 4, y: 4}
      ]

      PixelCache.write_coordinates_to_file(initial_list)

      result = File.read!(file_path)

      assert result ==
               <<0::size(66 * 8), 1, 0::size(10 * 8), 1, 0::size(10 * 8), 1, 0::size(10 * 8), 1>>
    end

    test "negative numbers" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file()

      initial_list = [
        %{x: -1, y: 1},
        %{x: -2, y: -2},
        %{x: 3, y: -3},
        %{x: -4, y: -4}
      ]

      PixelCache.write_coordinates_to_file(initial_list)

      result = File.read!(file_path)

      assert result ==
               <<0::size(11 * 8), 1, 0::size(16 * 8), 1, 0::size(4 * 8), 1, 0::size(30 * 8), 1,
                 0::size(35 * 8)>>
    end

    test "edge cases" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file()

      initial_list = [
        %{x: 4, y: 4},
        %{x: 0, y: 0},
        %{x: -5, y: -5},
        %{x: 4, y: -5},
        %{x: -5, y: 4}
      ]

      PixelCache.write_coordinates_to_file(initial_list)

      result = File.read!(file_path)

      assert result ==
               <<1, 0::size(8 * 8), 1, 0::size(45 * 8), 1, 0::size(34 * 8), 1, 0::size(8 * 8), 1>>
    end
  end

  # test "happy path" do
  #   TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)
  #
  #   initial_list = [
  #     %{x: 1, y: 1},
  #     %{x: 2, y: 2},
  #     %{x: 3, y: 2},
  #     %{x: 4, y: 2}
  #   ]
  #
  #   Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
  #   pixels = Canvas.list_pixels()
  #
  #   TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
  #     PixelCache.write_coordinates_to_file(pixels)
  #   end)
  #
  #   #
  #   cached_pixels =
  #     TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
  #       PixelCache.read_sub_section_of_file()
  #     end)
  #
  #   assert Enum.sort(initial_list) == Enum.sort(cached_pixels)
  # end
  #
  # test "negative numbers" do
  #   TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)
  #
  #   initial_list = [
  #     %{x: 1, y: -1},
  #     %{x: 2, y: 2},
  #     %{x: 3, y: -2},
  #     %{x: 4, y: 2}
  #   ]
  #
  #   Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
  #   pixels = Canvas.list_pixels()
  #
  #   TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
  #     PixelCache.write_coordinates_to_file(pixels)
  #   end)
  #
  #   #
  #   cached_pixels =
  #     TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
  #       PixelCache.read_sub_section_of_file()
  #     end)
  #
  #   assert Enum.sort(initial_list) == Enum.sort(cached_pixels)
  # end
  #
  # test "out of bounds numbers are ignored" do
  #   TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)
  #
  #   initial_list = [
  #     %{x: 2, y: 2},
  #     %{x: 3, y: -2},
  #     %{x: 4, y: 2},
  #     %{x: -4, y: 2},
  #     %{x: -5, y: -5},
  #     %{x: -6, y: -1}
  #   ]
  #
  #   Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
  #   pixels = Canvas.list_pixels()
  #
  #   TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
  #     PixelCache.write_coordinates_to_file(pixels)
  #   end)
  #
  #   cached_pixels =
  #     TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
  #       PixelCache.read_sub_section_of_file()
  #     end)
  #
  #   assert Enum.sort(Enum.take(initial_list, 5)) == Enum.sort(cached_pixels)
  # end
  #
  # test "sub section happy path" do
  #   TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)
  #
  #   initial_list = [
  #     %{x: 2, y: 2},
  #     %{x: 4, y: 2},
  #     %{x: 0, y: 0},
  #     %{x: 4, y: 4},
  #     %{x: 3, y: -2},
  #     %{x: -6, y: -1},
  #     %{x: 5, y: -1},
  #     %{x: -2, y: -2}
  #   ]
  #
  #   point = %{x: 2, y: 2}
  #
  #   Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
  #   pixels = Canvas.list_pixels()
  #
  #   TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
  #     PixelCache.write_coordinates_to_file(pixels)
  #   end)
  #
  #   cached_pixels =
  #     TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
  #       PixelCache.read_sub_section_of_file(point)
  #     end)
  #
  #   assert Enum.sort(Enum.take(initial_list, 4)) == Enum.sort(cached_pixels)
  # end
end
