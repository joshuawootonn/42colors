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
      assert response["errors"]["email"] == ["must have the @ sign and no spaces"]
    end

    test "renders errors for short password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email(), "password" => "short"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["password"] == ["should be at least 12 character(s)"]
    end

    test "renders errors for missing email", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"password" => valid_user_password()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["can't be blank"]
    end

    test "renders errors for missing password", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => unique_user_email()}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["password"] == ["can't be blank"]
    end

    test "renders multiple errors for multiple invalid fields", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => "invalid email", "password" => "short"}
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Registration failed"
      assert response["errors"]["email"] == ["must have the @ sign and no spaces"]
      assert response["errors"]["password"] == ["should be at least 12 character(s)"]
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
      assert response["errors"]["email"] == ["has already been taken"]
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
      assert response["errors"]["email"] == ["should be at most 160 character(s)"]
    end
  end
end
