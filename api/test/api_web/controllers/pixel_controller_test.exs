defmodule ApiWeb.PixelControllerTest do
  use ApiWeb.ConnCase

  import Api.CanvasFixtures

  alias Api.Canvas.Pixel

  @create_attrs %{
    y: 42,
    x: 42
  }
  @update_attrs %{
    y: 43,
    x: 43
  }
  @invalid_attrs %{y: nil, x: nil}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all pixels", %{conn: conn} do
      conn = get(conn, ~p"/api/pixels")
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create pixel" do
    @tag :skip
    test "renders pixel when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/api/pixels", pixel: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, ~p"/api/pixels/#{id}")

      assert %{
               "id" => ^id,
               "x" => 42,
               "y" => 42
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/pixels", pixel: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update pixel" do
    setup [:create_pixel]

    @tag :skip
    test "renders pixel when data is valid", %{conn: conn, pixel: %Pixel{id: id} = pixel} do
      conn = put(conn, ~p"/api/pixels/#{pixel}", pixel: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/pixels/#{id}")

      assert %{
               "id" => ^id,
               "x" => 43,
               "y" => 43
             } = json_response(conn, 200)["data"]
    end

    test "renders errors when data is invalid", %{conn: conn, pixel: pixel} do
      conn = put(conn, ~p"/api/pixels/#{pixel}", pixel: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
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
