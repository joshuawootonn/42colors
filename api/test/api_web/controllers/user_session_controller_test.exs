defmodule ApiWeb.UserSessionControllerTest do
  use ApiWeb.ConnCase, async: true

  import Api.AccountsFixtures

  setup do
    %{user: user_fixture()}
  end

  describe "POST /users/log_in" do
    test "logs the user in", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/users/me")
      response = json_response(conn, 401)
      assert response["message"] == "Unauthorized"

      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => user.email, "password" => valid_user_password()}
        })

      assert get_session(conn, :user_token)

      conn = get(conn, ~p"/api/users/me")
      response = json_response(conn, 200)
      assert response["user"]["email"] == user.email
    end

    test "logs the user in with remember me", %{conn: conn, user: user} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{
            "email" => user.email,
            "password" => valid_user_password(),
            "remember_me" => "true"
          }
        })

      assert conn.resp_cookies["_test_elixir_auth_web_user_remember_me"]
    end

    test "emits error message with invalid credentials", %{conn: conn, user: user} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => user.email, "password" => "invalid_password"}
        })

      response = json_response(conn, 401)
      assert response["message"] == "Invalid email or password"
    end
  end

  describe "DELETE /users/log_out" do
    test "logs the user out", %{conn: conn, user: user} do
      conn = conn |> log_in_user(user) |> delete(~p"/api/users/log_out")
      response = json_response(conn, 200)
      assert response["message"] == "Logged out successfully."
      refute get_session(conn, :user_token)
    end

    test "succeeds even if the user is not logged in", %{conn: conn} do
      conn = delete(conn, ~p"/api/users/log_out")
      response = json_response(conn, 200)
      assert response["message"] == "Logged out successfully."
      refute get_session(conn, :user_token)
    end
  end
end
