defmodule ApiWeb.UserResetPasswordControllerTest do
  use ApiWeb.ConnCase, async: true

  alias Api.Accounts
  alias Api.Repo
  import Api.AccountsFixtures

  setup do
    %{user: user_fixture()}
  end

  describe "POST /api/users/reset_password" do
    @tag :capture_log
    test "sends a new reset password token", %{conn: conn, user: user} do
      conn =
        post(conn, ~p"/api/users/reset_password", %{
          "user" => %{"email" => user.email}
        })

      response = json_response(conn, 200)

      assert response["message"] ==
               "If your email is in our system, you will receive instructions to reset your password shortly."

      assert Repo.get_by!(Accounts.UserToken, user_id: user.id).context == "reset_password"
    end

    test "does not send reset password token if email is invalid", %{conn: conn} do
      conn =
        post(conn, ~p"/api/users/reset_password", %{
          "user" => %{"email" => "unknown@example.com"}
        })

      response = json_response(conn, 200)

      assert response["message"] ==
               "If your email is in our system, you will receive instructions to reset your password shortly."

      assert Repo.all(Accounts.UserToken) == []
    end
  end

  describe "PUT /api/users/reset_password/:token" do
    setup %{user: user} do
      token =
        extract_user_token(fn url ->
          Accounts.deliver_user_reset_password_instructions(user, url)
        end)

      %{token: token}
    end

    test "resets password once", %{conn: conn, user: user, token: token} do
      conn =
        put(conn, ~p"/api/users/reset_password/#{token}", %{
          "user" => %{
            "password" => "new valid password",
            "password_confirmation" => "new valid password"
          }
        })

      response = json_response(conn, 200)
      assert response["message"] == "Password reset successfully."
      refute get_session(conn, :user_token)
      assert Accounts.get_user_by_email_and_password(user.email, "new valid password")
    end

    test "does not reset password on invalid data", %{conn: conn, token: token} do
      conn =
        put(conn, ~p"/api/users/reset_password/#{token}", %{
          "user" => %{
            "password" => "too short",
            "password_confirmation" => "does not match"
          }
        })

      response = json_response(conn, 422)
      assert response["errors"]["password"] == ["should be at least 12 character(s)"]
    end

    test "does not reset password with invalid token", %{conn: conn} do
      conn = put(conn, ~p"/api/users/reset_password/oops")
      response = json_response(conn, 401)
      assert response["message"] == "Reset password link is invalid or it has expired."
    end
  end
end
