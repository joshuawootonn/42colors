defmodule Api.CanvasTest do
  use Api.DataCase

  alias Api.Canvas

  describe "pixels" do
    alias Api.Canvas.Pixel

    import Api.CanvasFixtures

    test "list_pixels/0 returns all pixels" do
      pixel = pixel_fixture()
      assert Canvas.list_pixels() == [pixel]
    end

    test "get_pixel!/1 returns the pixel with given id" do
      pixel = pixel_fixture()
      assert Canvas.get_pixel!(pixel.id) == pixel
    end

    test "delete_pixel/1 deletes the pixel" do
      pixel = pixel_fixture()
      assert {:ok, %Pixel{}} = Canvas.delete_pixel(pixel)
      assert_raise Ecto.NoResultsError, fn -> Canvas.get_pixel!(pixel.id) end
    end

    test "change_pixel/1 returns a pixel changeset" do
      pixel = pixel_fixture()
      assert %Ecto.Changeset{} = Canvas.change_pixel(pixel)
    end
  end
end
