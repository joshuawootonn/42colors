defmodule ApiWeb.PageControllerTest do
  use ApiWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")

    assert String.contains?(html_response(conn, 200), "What's up brother?!")
  end
end
