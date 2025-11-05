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
end
