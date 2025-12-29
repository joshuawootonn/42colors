defmodule Api.Accounts.RegistrationTest do
  use Api.DataCase, async: true

  alias Api.Accounts
  alias Api.Logs.Log

  # Tests for user registration and initial grant behavior
  #
  # When a user registers:
  # 1. They start with 0 pixels (default from User schema)
  # 2. They receive a 4000 pixel initial grant
  # 3. Total balance: 4000 pixels
  #
  # The initial_grant log shows:
  # - old_balance: 0 (starting balance)
  # - new_balance: 4000 (after grant)
  # - diffs.grant_amount: 4000 (amount granted to user)

  describe "register_user/1" do
    @valid_attrs %{
      email: "test@example.com",
      password: "SecurePassword123!"
    }

    test "creates a user with correct initial balance" do
      {:ok, user} = Accounts.register_user(@valid_attrs)

      # User should have 4000 total after registration
      # (0 default + 4000 initial grant)
      assert user.balance == 4000
    end

    test "creates an initial_grant log with correct values" do
      {:ok, user} = Accounts.register_user(@valid_attrs)

      # Get the initial grant log
      log =
        Repo.one(from l in Log, where: l.user_id == ^user.id and l.log_type == "initial_grant")

      assert log != nil
      assert log.log_type == "initial_grant"
      assert log.old_balance == 0
      assert log.new_balance == 4000
    end

    test "initial_grant log diffs contain correct grant_amount" do
      {:ok, user} = Accounts.register_user(@valid_attrs)

      log =
        Repo.one(from l in Log, where: l.user_id == ^user.id and l.log_type == "initial_grant")

      assert log.diffs["grant_amount"] == 4000
      assert log.diffs["reason"] == "Initial grant for new user"
    end

    test "initial grant calculation is correct" do
      {:ok, user} = Accounts.register_user(@valid_attrs)

      log =
        Repo.one(from l in Log, where: l.user_id == ^user.id and l.log_type == "initial_grant")

      # Verify grant_amount equals the total given to user
      grant_amount = log.diffs["grant_amount"]
      assert grant_amount == 4000
      assert log.new_balance == 4000
    end

    test "user receives 4000 pixels total on registration" do
      {:ok, user} = Accounts.register_user(@valid_attrs)

      log =
        Repo.one(from l in Log, where: l.user_id == ^user.id and l.log_type == "initial_grant")

      # The user gets 4000 pixels total:
      # - 0 from the default User schema balance
      # - 4000 from the initial grant
      assert user.balance == 4000
      assert log.new_balance == 4000
      assert log.old_balance == 0
    end
  end
end
