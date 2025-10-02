defmodule Api.Logs.Log.ServiceTest do
  use Api.DataCase, async: true

  alias Api.Logs.Log.Service, as: LogService
  alias Api.Logs.Log
  alias Api.Accounts.User

  describe "create_log/1" do
    test "creates log and updates user balance" do
      user = insert_user(balance: 500)

      attrs = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "plot_created",
        diffs: %{"pixel_count" => 100}
      }

      assert {:ok, {log, updated_user}} = LogService.create_log(attrs)
      assert log.user_id == user.id
      assert log.old_balance == 500
      assert log.new_balance == 400
      assert log.log_type == "plot_created"
      assert updated_user.balance == 400
    end

    test "creates log with positive balance change (refund)" do
      user = insert_user(balance: 400)

      attrs = %{
        user_id: user.id,
        old_balance: 400,
        new_balance: 500,
        log_type: "plot_deleted",
        diffs: %{pixel_count: %{old: 100, new: 0}}
      }

      assert {:ok, {log, updated_user}} = LogService.create_log(attrs)
      assert log.old_balance == 400
      assert log.new_balance == 500
      balance_diff = log.new_balance - log.old_balance
      assert balance_diff == 100
      assert updated_user.balance == 500
    end

    test "creates log with plot_id" do
      user = insert_user(balance: 500)
      plot = insert_plot(user_id: user.id)

      attrs = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "plot_created",
        plot_id: plot.id
      }

      assert {:ok, {log, _user}} = LogService.create_log(attrs)
      assert log.plot_id == plot.id
    end

    test "creates log with diffs" do
      user = insert_user(balance: 500)

      attrs = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 450,
        log_type: "plot_created",
        diffs: %{pixel_count: %{old: 0, new: 50}, note: %{old: nil, new: "test"}}
      }

      assert {:ok, {log, _user}} = LogService.create_log(attrs)
      assert log.diffs[:pixel_count][:old] == 0
      assert log.diffs[:pixel_count][:new] == 50
      assert log.diffs[:note][:old] == nil
      assert log.diffs[:note][:new] == "test"
    end

    test "creates log with diffs when provided" do
      user = insert_user(balance: 500)

      attrs = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "plot_created",
        diffs: %{
          pixel_count: %{old: 0, new: 100}
        }
      }

      assert {:ok, {log, updated_user}} = LogService.create_log(attrs)
      assert updated_user.balance == 400

      # Verify balance tracking
      assert log.old_balance == 500
      assert log.new_balance == 400
      balance_diff = log.new_balance - log.old_balance
      assert balance_diff == -100

      # Verify diffs are stored correctly
      assert log.diffs[:pixel_count][:old] == 0
      assert log.diffs[:pixel_count][:new] == 100
    end

    test "returns error when user doesn't exist" do
      attrs = %{
        user_id: 99999,
        old_balance: 500,
        new_balance: 400,
        log_type: "plot_created"
      }

      assert {:error, :user_not_found} = LogService.create_log(attrs)
    end

    test "returns error when balance is insufficient" do
      user = insert_user(balance: 50)

      attrs = %{
        user_id: user.id,
        old_balance: 50,
        # This would make balance negative
        new_balance: -50,
        log_type: "plot_created"
      }

      assert {:error, :insufficient_balance} = LogService.create_log(attrs)

      # Verify balance wasn't changed
      reloaded_user = Repo.get!(User, user.id)
      assert reloaded_user.balance == 50
    end

    test "returns error for zero balance change" do
      user = insert_user(balance: 500)

      attrs = %{
        user_id: user.id,
        old_balance: 500,
        # No change
        new_balance: 500,
        log_type: "plot_created"
      }

      assert {:error, %Ecto.Changeset{} = changeset} =
               LogService.create_log(attrs)

      assert changeset.errors[:new_balance]
    end

    test "returns error for invalid log type" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "invalid_type"
      }

      assert {:error, %Ecto.Changeset{} = changeset} =
               LogService.create_log(attrs)

      assert changeset.errors[:log_type]
    end

    test "returns error when required fields are missing" do
      attrs = %{old_balance: 500, new_balance: 400}

      # When user_id is missing, we get a specific error
      assert {:error, :user_id_required} = LogService.create_log(attrs)
    end

    test "handles balance going to exactly zero" do
      user = insert_user(balance: 100)

      attrs = %{
        user_id: user.id,
        old_balance: 100,
        new_balance: 0,
        log_type: "plot_created"
      }

      assert {:ok, {_log, updated_user}} = LogService.create_log(attrs)
      assert updated_user.balance == 0
    end

    test "prevents balance from going negative" do
      user = insert_user(balance: 50)

      attrs = %{
        user_id: user.id,
        old_balance: 50,
        # This would make balance negative
        new_balance: -1,
        log_type: "plot_created"
      }

      assert {:error, :insufficient_balance} = LogService.create_log(attrs)
    end

    test "log creation is atomic - rolls back on error" do
      user = insert_user(balance: 500)
      initial_log_count = Repo.aggregate(Log, :count)

      # Try to create log with invalid data that will fail at insert
      attrs = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "invalid_type"
      }

      assert {:error, %Ecto.Changeset{}} = LogService.create_log(attrs)

      # Verify no log was created
      assert Repo.aggregate(Log, :count) == initial_log_count

      # Verify balance wasn't changed
      reloaded_user = Repo.get!(User, user.id)
      assert reloaded_user.balance == 500
    end

    test "handles string keys in attrs map" do
      user = insert_user(balance: 500)

      attrs = %{
        "user_id" => user.id,
        "old_balance" => 500,
        "new_balance" => 400,
        "log_type" => "plot_created"
      }

      assert {:ok, {log, updated_user}} = LogService.create_log(attrs)
      assert log.old_balance == 500
      assert log.new_balance == 400
      balance_diff = log.new_balance - log.old_balance
      assert balance_diff == -100
      assert updated_user.balance == 400
    end

    test "multiple logs update balance correctly" do
      user = insert_user(balance: 500)

      # First log: spend 100
      attrs1 = %{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "plot_created"
      }

      assert {:ok, {_, user_after_1}} = LogService.create_log(attrs1)
      assert user_after_1.balance == 400

      # Second log: refund 50
      attrs2 = %{
        user_id: user.id,
        old_balance: 400,
        new_balance: 450,
        log_type: "plot_deleted"
      }

      assert {:ok, {_, user_after_2}} = LogService.create_log(attrs2)
      assert user_after_2.balance == 450

      # Third log: spend 200
      attrs3 = %{
        user_id: user.id,
        old_balance: 450,
        new_balance: 250,
        log_type: "plot_created"
      }

      assert {:ok, {_, user_after_3}} = LogService.create_log(attrs3)
      assert user_after_3.balance == 250
    end
  end

  describe "create_create_plot_log/3" do
    test "creates create log with balance decrease" do
      user = insert_user(balance: 500)
      plot = insert_plot(user_id: user.id)

      assert {:ok, {log, updated_user}} =
               LogService.create_create_plot_log(user.id, plot.id, 100)

      assert log.old_balance == 500
      assert log.new_balance == 400
      balance_diff = log.new_balance - log.old_balance
      assert balance_diff == -100
      assert log.log_type == "plot_created"
      assert log.plot_id == plot.id

      assert log.diffs["pixel_count"]["old"] == 0
      assert log.diffs["pixel_count"]["new"] == 100

      assert updated_user.balance == 400
    end

    test "returns error when insufficient balance" do
      user = insert_user(balance: 50)
      plot = insert_plot(user_id: user.id)

      assert {:error, :insufficient_balance} =
               LogService.create_create_plot_log(user.id, plot.id, 100)
    end
  end

  describe "calculate_balance_change/2" do
    test "calculates balance change for negative change" do
      result = LogService.calculate_balance_change(1500, -100)

      assert result.old_balance == 1500
      assert result.new_balance == 1400
    end

    test "calculates balance change for positive change" do
      result = LogService.calculate_balance_change(1000, 200)

      assert result.old_balance == 1000
      assert result.new_balance == 1200
    end

    test "calculates balance change for zero change" do
      result = LogService.calculate_balance_change(500, 0)

      assert result.old_balance == 500
      assert result.new_balance == 500
    end

    test "handles edge cases with zero balance" do
      result = LogService.calculate_balance_change(0, 100)

      assert result.old_balance == 0
      assert result.new_balance == 100
    end
  end

  describe "get_user_balance/1" do
    test "returns user balance" do
      user = insert_user(balance: 500)

      assert {:ok, 500} = LogService.get_user_balance(user.id)
    end

    test "returns error when user doesn't exist" do
      assert {:error, :user_not_found} = LogService.get_user_balance(99999)
    end

    test "returns current balance after logs" do
      user = insert_user(balance: 500)

      LogService.create_log(%{
        user_id: user.id,
        old_balance: 500,
        new_balance: 400,
        log_type: "plot_created"
      })

      assert {:ok, 400} = LogService.get_user_balance(user.id)
    end
  end

  # Helper functions

  defp insert_user(attrs \\ %{}) do
    default_attrs = %{
      email: "user#{System.unique_integer()}@example.com",
      password: "password1234!@#$"
    }

    attrs = Map.merge(default_attrs, Map.new(attrs))
    balance = Map.get(attrs, :balance)

    user =
      %User{}
      |> User.registration_changeset(attrs)
      |> Api.Repo.insert!()

    # Update balance if specified
    if balance do
      user
      |> Ecto.Changeset.change(balance: balance)
      |> Api.Repo.update!()
    else
      user
    end
  end

  defp insert_plot(attrs) do
    polygon = %Geo.Polygon{
      coordinates: [
        [
          {0.0, 0.0},
          {0.0, 10.0},
          {10.0, 10.0},
          {10.0, 0.0},
          {0.0, 0.0}
        ]
      ],
      srid: 4326
    }

    attrs_map =
      attrs
      |> Enum.into(%{})
      |> Map.put(:name, "Plot #{System.unique_integer()}")
      |> Map.put_new(:polygon, polygon)

    Api.Canvas.Plot
    |> struct(attrs_map)
    |> Api.Repo.insert!()
  end
end
