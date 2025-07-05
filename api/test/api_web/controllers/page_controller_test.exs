defmodule ApiWeb.PageControllerTest do
  use ApiWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")

    assert String.contains?(text_response(conn, 200), "What's up brother?!")
  end

  test "GET /up", %{conn: conn} do
    conn = get(conn, ~p"/up")

    assert String.contains?(text_response(conn, 200), "We are up and running!")
  end
end
