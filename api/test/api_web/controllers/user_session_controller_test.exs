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
      response = json_response(conn, 200)
      assert response["status"] == "success"
      assert response["message"] == "Welcome back!"
      assert response["user"]["email"] == user.email

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
      assert response["status"] == "error"
      assert response["message"] == "Invalid email or password"
      assert response["errors"]["root"] == ["Invalid email or password"]
    end

    test "renders errors for missing email", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"password" => "somepassword"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["email"] == ["Email is required"]
    end

    test "renders errors for empty email", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => "", "password" => "somepassword"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["email"] == ["Email is required"]
    end

    test "renders errors for invalid email format", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => "invalid email", "password" => "somepassword"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["email"] == ["Invalid email format"]
    end

    test "renders errors for missing password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => "test@example.com"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["password"] == ["Password is required"]
    end

    test "renders errors for empty password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => "test@example.com", "password" => ""}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["password"] == ["Password is required"]
    end

    test "renders multiple errors for multiple missing fields", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["email"] == ["Email is required"]
      assert response["errors"]["password"] == ["Password is required"]
    end

    test "renders multiple errors for invalid email and missing password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/log_in", %{
          "user" => %{"email" => "invalid email"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Login failed"
      assert response["errors"]["email"] == ["Invalid email format"]
      assert response["errors"]["password"] == ["Password is required"]
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
