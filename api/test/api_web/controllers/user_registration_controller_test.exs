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

    test "render errors for invalid data", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/register", %{
          "user" => %{"email" => "with spaces", "password" => "too short"}
        })

      response = json_response(conn, 422)
      assert response["errors"]["email"] == ["must have the @ sign and no spaces"]
      assert response["errors"]["password"] == ["should be at least 12 character(s)"]
    end
  end
end
