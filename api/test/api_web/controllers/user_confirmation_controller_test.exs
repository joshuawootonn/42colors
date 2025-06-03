defmodule ApiWeb.UserConfirmationControllerTest do
  use ApiWeb.ConnCase, async: true

  alias Api.Accounts
  alias Api.Repo
  import Api.AccountsFixtures

  setup do
    %{user: user_fixture()}
  end


  describe "POST /api/users/confirm/:token" do
    test "confirms the given token once", %{conn: conn, user: user} do
      token =
        extract_user_token(fn url ->
          Accounts.deliver_user_confirmation_instructions(user, url)
        end)

      refute Accounts.get_user!(user.id).confirmed_at

      conn = post(conn, ~p"/api/users/confirm/#{token}")
      response = json_response(conn, 200)
      assert response["message"] == "User confirmed successfully."

      assert Accounts.get_user!(user.id).confirmed_at
      refute get_session(conn, :user_token)
      assert Repo.all(Accounts.UserToken) == []

      # When not logged in
      conn = post(conn, ~p"/api/users/confirm/#{token}")
      response = json_response(conn, 401)
      assert response["message"] == "User confirmation link is invalid or it has expired."

      # When logged in
      conn =
        build_conn()
        |> log_in_user(user)
        |> post(~p"/api/users/confirm/#{token}")

      response = json_response(conn, 200)
      assert response["message"] == "User already confirmed."
      assert Accounts.get_user!(user.id).confirmed_at
    end

    test "does not confirm email with invalid token", %{conn: conn, user: user} do
      refute Accounts.get_user!(user.id).confirmed_at

      conn = post(conn, ~p"/api/users/confirm/oops")
      response = json_response(conn, 401)
      assert response["message"] == "User confirmation link is invalid or it has expired."

      refute Accounts.get_user!(user.id).confirmed_at
    end
  end
end
