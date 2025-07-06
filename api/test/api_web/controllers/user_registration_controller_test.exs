defmodule ApiWeb.UserRegistrationControllerTest do
  use ApiWeb.ConnCase, async: true

  import Api.AccountsFixtures

  describe "POST /api/users/register" do
    @tag :capture_log
    test "creates account and logs the user in", %{conn: conn} do
      email = unique_user_email()

      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => valid_user_attributes(email: email)
        })

      assert get_session(conn, :user_token)
      response = json_response(conn, 200)
      assert response["message"] == "User created successfully."
      assert response["user"]["email"] == email
    end

    test "renders errors for invalid email format", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => "with spaces", "password" => valid_user_password()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["Email must have the @ sign and no spaces"]
    end

    test "renders errors for short password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email(), "password" => "short"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"

      # Short password will have multiple validation errors
      password_errors = response["errors"]["password"]
      assert "Password must have at least 12 characters" in password_errors
      assert "Password must contain at least one digit" in password_errors
      assert "Password must contain at least one special character" in password_errors
    end

    test "renders errors for missing email", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"password" => valid_user_password()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["Email is required"]
    end

    test "renders errors for missing password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["password"] == ["Password is required"]
    end

    test "renders multiple errors for multiple invalid fields", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => "invalid email", "password" => "short"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["Email must have the @ sign and no spaces"]

      # Short password will have multiple validation errors
      password_errors = response["errors"]["password"]
      assert "Password must have at least 12 characters" in password_errors
      assert "Password must contain at least one digit" in password_errors
      assert "Password must contain at least one special character" in password_errors
    end

    test "renders error for duplicate email", %{conn: conn} do
      user = user_fixture()

      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => user.email, "password" => valid_user_password()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["Email is already taken"]
    end

    test "renders error for email that is too long", %{conn: conn} do
      long_email = String.duplicate("a", 150) <> "@example.com"

      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => long_email, "password" => valid_user_password()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["Email must be less than 160 characters"]
    end

    test "renders error for password without digit", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email(), "password" => "longpassword!"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["password"] == ["Password must contain at least one digit"]
    end

    test "renders error for password without special character", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email(), "password" => "longpassword1"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"

      assert response["errors"]["password"] == [
               "Password must contain at least one special character"
             ]
    end

    test "renders error for password that is too long", %{conn: conn} do
      long_password = String.duplicate("a", 75) <> "1!"

      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email(), "password" => long_password}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["password"] == ["Password must be less than 72 characters"]
    end

    test "renders multiple password errors", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email(), "password" => "short"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"

      # Should have multiple password errors
      password_errors = response["errors"]["password"]
      assert "Password must have at least 12 characters" in password_errors
      assert "Password must contain at least one digit" in password_errors
      assert "Password must contain at least one special character" in password_errors
    end
  end
end
