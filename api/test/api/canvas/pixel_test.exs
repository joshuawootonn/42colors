defmodule Api.PixelTest do
  use Api.DataCase

  alias Api.Canvas.Pixel.Repo, as: PixelRepo

  describe "pixels" do
    alias Api.Canvas.Pixel

    import Api.CanvasFixtures

    test "list_pixels/0 returns all pixels" do
      pixel = pixel_fixture()
      assert PixelRepo.list_pixels() == [pixel]
    end

    test "get_pixel!/1 returns the pixel with given id" do
      pixel = pixel_fixture()
      assert PixelRepo.get_pixel!(pixel.id) == pixel
    end

    test "delete_pixel/1 deletes the pixel" do
      pixel = pixel_fixture()
      assert {:ok, %Pixel{}} = PixelRepo.delete_pixel(pixel)
      assert_raise Ecto.NoResultsError, fn -> PixelRepo.get_pixel!(pixel.id) end
    end

    test "change_pixel/1 returns a pixel changeset" do
      pixel = pixel_fixture()
      assert %Ecto.Changeset{} = PixelRepo.change_pixel(pixel)
    end

    test "create_many_pixels/1 handles large batches by splitting into smaller batches" do
      # Create a large batch that would exceed PostgreSQL's 65535 parameter limit
      # Each pixel has 7 fields, so we can insert ~9,362 pixels max per batch
      # Let's create 15,000 pixels to force batching
      large_batch =
        1..15_000
        |> Enum.map(fn i ->
          %{x: rem(i, 1000), y: div(i, 1000), color_ref: rem(i, 256)}
        end)

      assert {:ok, pixels} = PixelRepo.create_many_pixels(large_batch)
      assert length(pixels) == 15_000

      # Verify all pixels were created correctly
      Enum.zip(large_batch, pixels)
      |> Enum.each(fn {input, created} ->
        assert created.x == input.x
        assert created.y == input.y
        assert created.color_ref == input.color_ref
      end)
    end

    test "create_many_pixels/1 handles batches at the limit boundary" do
      # Test with exactly 10,000 pixels (well under the limit but still a large batch)
      batch_at_limit =
        1..10_000
        |> Enum.map(fn i ->
          %{x: rem(i, 1000), y: div(i, 1000), color_ref: rem(i, 256)}
        end)

      assert {:ok, pixels} = PixelRepo.create_many_pixels(batch_at_limit)
      assert length(pixels) == 10_000
    end
  end

  describe "list_pixels_in_chunk/3" do
    test "returns pixels within the chunk boundaries" do
      # Create pixels inside the chunk (0, 0) with size 4
      {:ok, _} =
        PixelRepo.create_many_pixels([
          %{x: 0, y: 0, color_ref: 1},
          %{x: 1, y: 1, color_ref: 2},
          %{x: 3, y: 3, color_ref: 3}
        ])

      result = PixelRepo.list_pixels_in_chunk(0, 0, 4)

      assert length(result) == 3
      assert Enum.find(result, &(&1.x == 0 and &1.y == 0 and &1.color_ref == 1))
      assert Enum.find(result, &(&1.x == 1 and &1.y == 1 and &1.color_ref == 2))
      assert Enum.find(result, &(&1.x == 3 and &1.y == 3 and &1.color_ref == 3))
    end

    test "excludes pixels outside the chunk boundaries" do
      {:ok, _} =
        PixelRepo.create_many_pixels([
          %{x: 0, y: 0, color_ref: 1},
          %{x: 5, y: 5, color_ref: 2},
          %{x: -1, y: 0, color_ref: 3}
        ])

      result = PixelRepo.list_pixels_in_chunk(0, 0, 4)

      assert length(result) == 1
      assert Enum.find(result, &(&1.x == 0 and &1.y == 0))
      refute Enum.find(result, &(&1.x == 5))
      refute Enum.find(result, &(&1.x == -1))
    end

    test "returns only the most recent pixel at each position" do
      # Create first pixel
      {:ok, _} = PixelRepo.create_many_pixels([%{x: 1, y: 1, color_ref: 5}])

      # Overwrite with new color (higher id wins when timestamps are equal)
      {:ok, _} = PixelRepo.create_many_pixels([%{x: 1, y: 1, color_ref: 10}])

      result = PixelRepo.list_pixels_in_chunk(0, 0, 4)

      # Should only return one pixel with the most recent color
      assert length(result) == 1
      assert hd(result).color_ref == 10
    end

    test "handles negative coordinates" do
      {:ok, _} =
        PixelRepo.create_many_pixels([
          %{x: -4, y: -4, color_ref: 1},
          %{x: -2, y: -2, color_ref: 2},
          %{x: -1, y: -1, color_ref: 3}
        ])

      result = PixelRepo.list_pixels_in_chunk(-4, -4, 4)

      assert length(result) == 3
    end

    test "returns empty list when no pixels in chunk" do
      {:ok, _} = PixelRepo.create_many_pixels([%{x: 100, y: 100, color_ref: 1}])

      result = PixelRepo.list_pixels_in_chunk(0, 0, 4)

      assert result == []
    end

    test "handles chunk at boundary correctly" do
      # Pixel at the edge of chunk (0,0) with size 4 -> includes (0,0) to (3,3)
      {:ok, _} =
        PixelRepo.create_many_pixels([
          %{x: 3, y: 3, color_ref: 1},
          %{x: 4, y: 4, color_ref: 2}
        ])

      result = PixelRepo.list_pixels_in_chunk(0, 0, 4)

      # Only (3,3) should be included, (4,4) is outside
      assert length(result) == 1
      assert hd(result).x == 3
      assert hd(result).y == 3
    end
  end
end
