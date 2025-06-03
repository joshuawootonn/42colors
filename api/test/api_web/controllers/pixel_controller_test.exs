defmodule ApiWeb.PixelControllerTest do
  use ApiWeb.ConnCase

  import Api.CanvasFixtures

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all pixels", %{conn: conn} do
      conn = get(conn, ~p"/api/pixels")
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "delete pixel" do
    setup [:create_pixel]

    test "deletes chosen pixel", %{conn: conn, pixel: pixel} do
      conn = delete(conn, ~p"/api/pixels/#{pixel}")
      assert response(conn, 204)

      assert_error_sent 404, fn ->
        get(conn, ~p"/api/pixels/#{pixel}")
      end
    end
  end

  defp create_pixel(_) do
    pixel = pixel_fixture()
    %{pixel: pixel}
  end
end
