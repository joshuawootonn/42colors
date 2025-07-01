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
      new_password = "new valid password1!"

      conn =
        put(conn, ~p"/api/users/reset_password/#{token}", %{
          "user" => %{
            "password" => new_password,
            "password_confirmation" => new_password
          }
        })

      response = json_response(conn, 200)
      assert response["message"] == "Password reset successfully."
      refute get_session(conn, :user_token)
      assert Accounts.get_user_by_email_and_password(user.email, new_password)
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
      assert response["status"] == "error"
      assert response["message"] == "Password reset failed"

      # Should have structured validation errors
      password_errors = response["errors"]["password"]
      assert "Password must have at least 12 characters" in password_errors
      assert "Password must contain at least one digit" in password_errors
      assert "Password must contain at least one special character" in password_errors
    end

    test "renders error for password confirmation mismatch", %{conn: conn, token: token} do
      conn =
        put(conn, ~p"/api/users/reset_password/#{token}", %{
          "user" => %{
            "password" => "new valid password1!",
            "password_confirmation" => "different password1!"
          }
        })

      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Password reset failed"
      assert response["errors"]["password_confirmation"] == ["Passwords do not match"]
    end

    test "does not reset password with invalid token", %{conn: conn} do
      conn = put(conn, ~p"/api/users/reset_password/oops")
      response = json_response(conn, 401)
      assert response["message"] == "Reset password link is invalid or it has expired."
    end
  end
end
