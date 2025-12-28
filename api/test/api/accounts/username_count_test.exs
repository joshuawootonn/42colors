defmodule Api.Accounts.UsernameCountTest do
  use Api.DataCase, async: true

  alias Api.Accounts.UsernameCount

  describe "get_or_create_count/1" do
    test "creates a new count record for a color" do
      result = UsernameCount.Repo.get_or_create_count(0)

      assert %UsernameCount{} = result
      assert result.color_id == 0
      assert result.count == 0
    end

    test "returns existing count record if it already exists" do
      # Create first
      first = UsernameCount.Repo.get_or_create_count(0)

      # Get again
      second = UsernameCount.Repo.get_or_create_count(0)

      assert first.id == second.id
      assert second.count == 0
    end
  end

  describe "increment_count/1" do
    test "increments count atomically" do
      # Create initial record
      UsernameCount.Repo.get_or_create_count(0)

      # Increment
      {:ok, new_count} = UsernameCount.Repo.increment_count(0)
      assert new_count == 1

      # Verify in database
      record = Repo.get_by(UsernameCount, color_id: 0)
      assert record.count == 1
    end

    test "multiple increments work correctly" do
      UsernameCount.Repo.get_or_create_count(0)

      {:ok, count1} = UsernameCount.Repo.increment_count(0)
      assert count1 == 1

      {:ok, count2} = UsernameCount.Repo.increment_count(0)
      assert count2 == 2

      {:ok, count3} = UsernameCount.Repo.increment_count(0)
      assert count3 == 3
    end

    test "creates record if it doesn't exist before incrementing" do
      {:ok, new_count} = UsernameCount.Repo.increment_count(1)
      assert new_count == 1
    end
  end

  describe "get_next_username/1" do
    test "returns color name for count 0" do
      username = UsernameCount.Repo.get_next_username(0)
      assert username == "transparent"
    end

    test "returns color name with number for count > 0 (no dashes)" do
      # Set up count
      UsernameCount.Repo.get_or_create_count(0)
      UsernameCount.Repo.increment_count(0)

      username = UsernameCount.Repo.get_next_username(0)
      assert username == "transparent1"
    end

    test "formats username correctly for higher counts" do
      # Set up count
      UsernameCount.Repo.get_or_create_count(1)
      Enum.each(1..5, fn _ -> UsernameCount.Repo.increment_count(1) end)

      username = UsernameCount.Repo.get_next_username(1)
      assert username == "alabaster5"
    end

    test "works with different colors" do
      username_ruby = UsernameCount.Repo.get_next_username(40)
      assert username_ruby == "ruby"

      UsernameCount.Repo.increment_count(40)
      username_ruby1 = UsernameCount.Repo.get_next_username(40)
      assert username_ruby1 == "ruby1"
    end
  end

  describe "concurrent operations" do
    test "concurrent increments don't lose counts" do
      UsernameCount.Repo.get_or_create_count(0)

      # Simulate concurrent increments using tasks
      tasks =
        Enum.map(1..10, fn _ ->
          Task.async(fn ->
            UsernameCount.Repo.increment_count(0)
          end)
        end)

      # Wait for all to complete
      Enum.each(tasks, &Task.await/1)

      # Verify final count
      record = Repo.get_by(UsernameCount, color_id: 0)
      assert record.count == 10
    end
  end
end
