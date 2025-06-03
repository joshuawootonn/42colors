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
        %{x: 1, y: 1, color: 1},
        %{x: 2, y: 2, color: 1},
        %{x: 3, y: 3, color: 1},
        %{x: 4, y: 4, color: 1}
      ]

      PixelCache.write_coordinates_to_file(initial_list)

      result = File.read!(file_path)

      assert result ==
               <<0::size(66 * 8), 1, 0::size(10 * 8), 1, 0::size(10 * 8), 1, 0::size(10 * 8), 1>>
    end

    test "non black colors numbers" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file()

      initial_list = [
        %{x: 1, y: 1, color: 3},
        %{x: 2, y: 2, color: 4},
        %{x: 3, y: 3, color: 5},
        %{x: 4, y: 4, color: 6}
      ]

      PixelCache.write_coordinates_to_file(initial_list)

      result = File.read!(file_path)

      assert result ==
               <<0::size(66 * 8), 3, 0::size(10 * 8), 4, 0::size(10 * 8), 5, 0::size(10 * 8), 6>>
    end

    test "negative numbers" do
      file_path = Application.get_env(:api, Api.PixelCache)[:pixel_cache_file_name]
      PixelCache.initialize_file()

      initial_list = [
        %{x: -1, y: 1, color: 1},
        %{x: -2, y: -2, color: 1},
        %{x: 3, y: -3, color: 1},
        %{x: -4, y: -4, color: 1}
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
        %{x: 4, y: 4, color: 1},
        %{x: 0, y: 0, color: 1},
        %{x: -5, y: -5, color: 1},
        %{x: 4, y: -5, color: 1},
        %{x: -5, y: 4, color: 1}
      ]

      PixelCache.write_coordinates_to_file(initial_list)

      result = File.read!(file_path)

      assert result ==
               <<1, 0::size(8 * 8), 1, 0::size(45 * 8), 1, 0::size(34 * 8), 1, 0::size(8 * 8), 1>>
    end
  end

  describe "read binary from file" do
    test "positive numbers" do
      initial_list = [
        %{x: 1, y: 1, color: 1},
        %{x: 2, y: 2, color: 1},
        %{x: 3, y: 3, color: 1},
        %{x: 4, y: 4, color: 1}
      ]

      PixelCache.initialize_file()
      PixelCache.write_coordinates_to_file(initial_list)

      result = PixelCache.read_sub_section_of_file_as_binary(%{x: 1, y: 1})

      assert result ==
               <<1, 0::size(4 * 8), 1, 0::size(4 * 8), 1, 0::size(4 * 8), 1>>
    end

    test "negative numbers" do
      initial_list = [
        %{x: -1, y: 1, color: 1},
        %{x: -2, y: -2, color: 1},
        %{x: 3, y: -3, color: 1},
        %{x: -4, y: -4, color: 1}
      ]

      PixelCache.initialize_file()
      PixelCache.write_coordinates_to_file(initial_list)

      assert PixelCache.read_sub_section_of_file_as_binary(%{x: -5, y: -5}) ==
               <<0::size(5 * 8), 1, 0::size(9 * 8), 1>>
    end

    test "edge cases" do
      initial_list = [
        %{x: 4, y: 4, color: 1},
        %{x: 0, y: 0, color: 1},
        %{x: -5, y: -5, color: 1},
        %{x: 4, y: -5, color: 1},
        %{x: -5, y: 4, color: 1}
      ]

      PixelCache.initialize_file()
      PixelCache.write_coordinates_to_file(initial_list)

      assert PixelCache.read_sub_section_of_file_as_binary(%{x: -5, y: -5}) ==
               <<1, 0::size(15 * 8)>>

      assert PixelCache.read_sub_section_of_file_as_binary(%{x: 1, y: 1}) ==
               <<0::size(15 * 8), 1>>

      assert PixelCache.read_sub_section_of_file_as_binary(%{x: -5, y: 1}) ==
               <<0::size(12 * 8), 1, 0::size(3 * 8)>>
    end
  end
end
