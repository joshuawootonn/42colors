defmodule Api.Canvas.ChunkUtilsTest do
  use ExUnit.Case

  alias Api.Canvas.ChunkUtils

  describe "get_chunk_key/2" do
    test "calculates correct chunk key for positive coordinates" do
      # Using test config viewport_diameter: 4
      assert ChunkUtils.get_chunk_key(2, 3) == "x: 0 y: 0"
      assert ChunkUtils.get_chunk_key(6, 11) == "x: 4 y: 8"
    end

    test "calculates correct chunk key for negative coordinates" do
      # Using test config viewport_diameter: 4
      assert ChunkUtils.get_chunk_key(-2, -3) == "x: -4 y: -4"
      assert ChunkUtils.get_chunk_key(-6, -1) == "x: -8 y: -4"
    end

    test "calculates correct chunk key for coordinates on chunk boundaries" do
      # Using test config viewport_diameter: 4
      assert ChunkUtils.get_chunk_key(0, 0) == "x: 0 y: 0"
      assert ChunkUtils.get_chunk_key(4, 4) == "x: 4 y: 4"
      assert ChunkUtils.get_chunk_key(-4, -4) == "x: -4 y: -4"
    end
  end

  describe "get_chunk_origin/2" do
    test "calculates correct chunk origin for positive coordinates" do
      # Using test config viewport_diameter: 4
      assert ChunkUtils.get_chunk_origin(2, 3) == {0, 0}
      assert ChunkUtils.get_chunk_origin(6, 11) == {4, 8}
    end

    test "calculates correct chunk origin for negative coordinates" do
      # Using test config viewport_diameter: 4
      assert ChunkUtils.get_chunk_origin(-2, -3) == {-4, -4}
      assert ChunkUtils.get_chunk_origin(-6, -1) == {-8, -4}
    end
  end

  describe "get_affected_chunk_keys/1" do
    test "calculates chunk keys for a small polygon within one chunk" do
      # Using test config viewport_diameter: 4
      polygon = %Geo.Polygon{
        coordinates: [[{1, 1}, {1, 2}, {2, 2}, {2, 1}, {1, 1}]],
        srid: 4326
      }

      chunk_keys = ChunkUtils.get_affected_chunk_keys(polygon)
      assert chunk_keys == ["x: 0 y: 0"]
    end

    test "calculates chunk keys for a polygon spanning multiple chunks" do
      # Using test config viewport_diameter: 4
      polygon = %Geo.Polygon{
        coordinates: [[{2, 2}, {2, 6}, {6, 6}, {6, 2}, {2, 2}]],
        srid: 4326
      }

      chunk_keys = ChunkUtils.get_affected_chunk_keys(polygon)
      assert Enum.sort(chunk_keys) == ["x: 0 y: 0", "x: 0 y: 4", "x: 4 y: 0", "x: 4 y: 4"]
    end

    test "calculates chunk keys for a polygon with negative coordinates" do
      # Using test config viewport_diameter: 4
      polygon = %Geo.Polygon{
        coordinates: [[{-2, -2}, {-2, 2}, {2, 2}, {2, -2}, {-2, -2}]],
        srid: 4326
      }

      chunk_keys = ChunkUtils.get_affected_chunk_keys(polygon)

      assert Enum.sort(chunk_keys) == [
               "x: -4 y: -4",
               "x: -4 y: 0",
               "x: 0 y: -4",
               "x: 0 y: 0"
             ]
    end

    test "returns empty list for invalid polygon" do
      assert ChunkUtils.get_affected_chunk_keys(nil) == []
      assert ChunkUtils.get_affected_chunk_keys("invalid") == []
    end
  end

  describe "chunk_length/0" do
    test "returns the correct chunk length from config" do
      # Using test config viewport_diameter: 4
      assert ChunkUtils.chunk_length() == 4
    end
  end
end
