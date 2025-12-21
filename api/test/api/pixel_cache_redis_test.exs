defmodule Api.PixelCache.RedisTest do
  use ExUnit.Case, async: false
  alias Api.PixelCache.Redis, as: RedisCache

  # Test uses viewport_diameter of 4 from test.exs config
  @chunk_size 4

  setup do
    # Clear all chunks before each test
    RedisCache.clear_all_chunks()
    :ok
  end

  describe "get_chunk/2" do
    test "returns nil for non-existent chunk" do
      assert {:ok, nil} = RedisCache.get_chunk(0, 0)
      assert {:ok, nil} = RedisCache.get_chunk(100, 200)
    end

    test "returns stored binary data" do
      binary_data = <<1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16>>
      :ok = RedisCache.set_chunk(0, 0, binary_data)

      assert {:ok, ^binary_data} = RedisCache.get_chunk(0, 0)
    end
  end

  describe "set_chunk/3" do
    test "stores and retrieves chunk data" do
      chunk_data = :binary.copy(<<0>>, @chunk_size * @chunk_size)
      :ok = RedisCache.set_chunk(4, 8, chunk_data)

      assert {:ok, ^chunk_data} = RedisCache.get_chunk(4, 8)
    end

    test "overwrites existing chunk data" do
      initial_data = <<1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1>>
      updated_data = <<2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2>>

      :ok = RedisCache.set_chunk(0, 0, initial_data)
      assert {:ok, ^initial_data} = RedisCache.get_chunk(0, 0)

      :ok = RedisCache.set_chunk(0, 0, updated_data)
      assert {:ok, ^updated_data} = RedisCache.get_chunk(0, 0)
    end
  end

  describe "chunk_exists?/2" do
    test "returns false for non-existent chunk" do
      refute RedisCache.chunk_exists?(0, 0)
      refute RedisCache.chunk_exists?(999, 999)
    end

    test "returns true for existing chunk" do
      :ok = RedisCache.set_chunk(4, 4, <<1, 2, 3, 4>>)
      assert RedisCache.chunk_exists?(4, 4)
    end
  end

  describe "clear_all_chunks/0" do
    test "removes all chunks" do
      :ok = RedisCache.set_chunk(0, 0, <<1>>)
      :ok = RedisCache.set_chunk(4, 0, <<2>>)
      :ok = RedisCache.set_chunk(0, 4, <<3>>)

      assert RedisCache.chunk_exists?(0, 0)
      assert RedisCache.chunk_exists?(4, 0)
      assert RedisCache.chunk_exists?(0, 4)

      :ok = RedisCache.clear_all_chunks()

      refute RedisCache.chunk_exists?(0, 0)
      refute RedisCache.chunk_exists?(4, 0)
      refute RedisCache.chunk_exists?(0, 4)
    end

    test "succeeds when no chunks exist" do
      assert :ok = RedisCache.clear_all_chunks()
    end
  end

  describe "update_pixels_in_chunks/1" do
    test "creates new chunk when none exists" do
      pixels = [
        %{x: 0, y: 0, color_ref: 5},
        %{x: 1, y: 1, color_ref: 10}
      ]

      :ok = RedisCache.update_pixels_in_chunks(pixels)

      assert {:ok, data} = RedisCache.get_chunk(0, 0)
      # Chunk is 4x4 = 16 bytes
      assert byte_size(data) == 16

      # Check pixel at (0, 0) - offset 0
      assert :binary.at(data, 0) == 5
      # Check pixel at (1, 1) - offset = 1*4 + 1 = 5
      assert :binary.at(data, 5) == 10
      # Other positions should be 0
      assert :binary.at(data, 1) == 0
    end

    test "updates existing chunk" do
      # First, set up a chunk with some data
      initial_chunk = :binary.copy(<<0>>, 16)
      :ok = RedisCache.set_chunk(0, 0, initial_chunk)

      # Update with new pixels
      pixels = [
        %{x: 2, y: 2, color_ref: 7}
      ]

      :ok = RedisCache.update_pixels_in_chunks(pixels)

      assert {:ok, data} = RedisCache.get_chunk(0, 0)
      # Pixel at (2, 2) - offset = 2*4 + 2 = 10
      assert :binary.at(data, 10) == 7
    end

    test "handles pixels spanning multiple chunks" do
      # With chunk_size of 4, pixels at (2,2) and (6,6) are in different chunks
      pixels = [
        %{x: 2, y: 2, color_ref: 1},
        %{x: 6, y: 6, color_ref: 2}
      ]

      :ok = RedisCache.update_pixels_in_chunks(pixels)

      # First chunk (0, 0)
      assert {:ok, chunk1} = RedisCache.get_chunk(0, 0)
      assert :binary.at(chunk1, 2 * 4 + 2) == 1

      # Second chunk (4, 4)
      assert {:ok, chunk2} = RedisCache.get_chunk(4, 4)
      # (6,6) in chunk (4,4) has local coords (2,2) -> offset = 2*4 + 2 = 10
      assert :binary.at(chunk2, 10) == 2
    end

    test "handles negative coordinates" do
      pixels = [
        %{x: -2, y: -2, color_ref: 3}
      ]

      :ok = RedisCache.update_pixels_in_chunks(pixels)

      # Chunk origin for (-2, -2) with chunk_size 4 is (-4, -4)
      assert {:ok, data} = RedisCache.get_chunk(-4, -4)
      # Local coords: (-2 - (-4), -2 - (-4)) = (2, 2) -> offset = 2*4 + 2 = 10
      assert :binary.at(data, 10) == 3
    end

    test "updates multiple pixels in same chunk" do
      pixels = [
        %{x: 0, y: 0, color_ref: 1},
        %{x: 1, y: 0, color_ref: 2},
        %{x: 2, y: 0, color_ref: 3},
        %{x: 3, y: 0, color_ref: 4}
      ]

      :ok = RedisCache.update_pixels_in_chunks(pixels)

      assert {:ok, data} = RedisCache.get_chunk(0, 0)
      # First row should be [1, 2, 3, 4]
      assert :binary.at(data, 0) == 1
      assert :binary.at(data, 1) == 2
      assert :binary.at(data, 2) == 3
      assert :binary.at(data, 3) == 4
    end

    test "overwrites existing pixel in chunk" do
      # Set initial pixel
      :ok = RedisCache.update_pixels_in_chunks([%{x: 1, y: 1, color_ref: 5}])

      assert {:ok, data1} = RedisCache.get_chunk(0, 0)
      assert :binary.at(data1, 5) == 5

      # Overwrite with new color
      :ok = RedisCache.update_pixels_in_chunks([%{x: 1, y: 1, color_ref: 15}])

      assert {:ok, data2} = RedisCache.get_chunk(0, 0)
      assert :binary.at(data2, 5) == 15
    end

    test "handles empty pixel list" do
      assert :ok = RedisCache.update_pixels_in_chunks([])
    end
  end
end
