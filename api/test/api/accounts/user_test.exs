defmodule Api.Accounts.UserTest do
  use ExUnit.Case, async: true

  alias Api.Accounts.User

  describe "generate_username/1" do
    test "generates color names for first 44 users (0-43)" do
      assert User.generate_username(0) == "transparent"
      assert User.generate_username(1) == "white"
      assert User.generate_username(2) == "alabaster"
      assert User.generate_username(3) == "silver"
      assert User.generate_username(43) == "kiss"
    end

    test "generates color-cycle format for users beyond first 44" do
      # Second cycle (users 44-87)
      assert User.generate_username(44) == "transparent-1"
      assert User.generate_username(45) == "white-1"
      assert User.generate_username(87) == "kiss-1"

      # Third cycle (users 88-131)
      assert User.generate_username(88) == "transparent-2"
      assert User.generate_username(89) == "white-2"
      assert User.generate_username(131) == "kiss-2"
    end

    test "cycles through colors correctly" do
      # Verify the pattern repeats every 44 users
      assert User.generate_username(0) == "transparent"
      assert User.generate_username(44) == "transparent-1"
      assert User.generate_username(88) == "transparent-2"
      assert User.generate_username(132) == "transparent-3"

      assert User.generate_username(1) == "white"
      assert User.generate_username(45) == "white-1"
      assert User.generate_username(89) == "white-2"
      assert User.generate_username(133) == "white-3"
    end

    test "handles large user counts" do
      # User 440 should be transparent-10 (440 / 44 = 10)
      assert User.generate_username(440) == "transparent-10"

      # User 1000 should be silver-22 (1000 % 44 = 32 -> silver, 1000 / 44 = 22)
      assert User.generate_username(1000) == "royal-22"
    end
  end
end
