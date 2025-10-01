defmodule Api.Canvas.PlotLoggingIntegrationTest do
  use Api.DataCase

  alias Api.Canvas.Plot
  alias Api.Logs.Log
  alias Api.Accounts.User
  import Api.AccountsFixtures

  describe "plot logging integration" do
    test "creates log entry when plot is created" do
      user = user_fixture()
      # Give user sufficient balance
      user = Api.Repo.update!(Ecto.Changeset.change(user, balance: 1000))

      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      attrs = %{
        name: "Test Plot",
        description: "Test Description",
        user_id: user.id,
        polygon: polygon
      }

      # Create plot should also create log
      assert {:ok, plot} = Plot.Service.create_plot(attrs)

      # Verify log was created
      log = Api.Repo.get_by(Log, plot_id: plot.id, log_type: "plot_created")
      assert log != nil
      assert log.user_id == user.id
      # Negative because user spent currency
      assert log.amount == -100

      # Verify standardized metadata format
      assert log.metadata["name"] == "Test Plot"
      assert log.metadata["description"] == "Test Description"
      assert log.metadata["size"] == 100

      # Verify diffs array tracks what was created
      diffs = log.metadata["diffs"]
      assert is_list(diffs)
      # At least name and polygon should be set
      assert length(diffs) >= 2

      # Check that name field was tracked
      name_change = Enum.find(diffs, fn change -> change["field"] == "name" end)
      assert name_change != nil
      assert name_change["old_value"] == nil
      assert name_change["new_value"] == "Test Plot"

      # Verify user balance was updated
      updated_user = Api.Repo.get!(User, user.id)
      assert updated_user.balance == 900
    end

    test "creates log entry when plot is updated" do
      user = user_fixture()
      user = Api.Repo.update!(Ecto.Changeset.change(user, balance: 1000))

      # Create plot first
      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      {:ok, plot} =
        Plot.Service.create_plot(%{
          name: "Original Plot",
          user_id: user.id,
          polygon: polygon
        })

      # Update plot name
      assert {:ok, _updated_plot} = Plot.Service.update_plot(plot, %{name: "Updated Plot"})

      # Verify update log was created
      update_log = Api.Repo.get_by(Log, plot_id: plot.id, log_type: "plot_updated")
      assert update_log != nil
      assert update_log.user_id == user.id
      # No pixel change, so no cost
      assert update_log.amount == 0

      # Verify standardized metadata format
      assert update_log.metadata["name"] == "Updated Plot"
      # No description was set
      assert update_log.metadata["description"] == nil
      assert update_log.metadata["size"] == 100

      # Verify diffs array
      diffs = update_log.metadata["diffs"]
      assert length(diffs) == 1
      assert hd(diffs)["field"] == "name"
      assert hd(diffs)["old_value"] == "Original Plot"
      assert hd(diffs)["new_value"] == "Updated Plot"
    end

    test "creates log entry when plot is deleted" do
      user = user_fixture()
      user = Api.Repo.update!(Ecto.Changeset.change(user, balance: 1000))

      # Create plot first
      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      {:ok, plot} =
        Plot.Service.create_plot(%{
          name: "Plot to Delete",
          user_id: user.id,
          polygon: polygon
        })

      # Delete plot
      assert {:ok, _deleted_plot} = Plot.Service.delete_plot(plot)

      # Verify delete log was created
      delete_log = Api.Repo.get_by(Log, plot_id: plot.id, log_type: "plot_deleted")
      assert delete_log != nil
      assert delete_log.user_id == user.id
      # Positive because user got refund
      assert delete_log.amount == 100

      # Verify standardized metadata format
      assert delete_log.metadata["name"] == "Plot to Delete"
      assert delete_log.metadata["description"] == nil
      assert delete_log.metadata["size"] == 100

      # Verify diffs array shows deletion
      diffs = delete_log.metadata["diffs"]
      assert is_list(diffs)
      assert length(diffs) == 1

      # Check that deleted_at field was tracked
      deleted_at_change = Enum.find(diffs, fn change -> change["field"] == "deleted_at" end)
      assert deleted_at_change != nil
      assert deleted_at_change["old_value"] == nil
      # Should have a timestamp
      assert deleted_at_change["new_value"] != nil

      # Verify user balance was updated (spent 100, got 100 back = 1000 total)
      updated_user = Api.Repo.get!(User, user.id)
      assert updated_user.balance == 1000
    end

    test "handles insufficient balance error" do
      user = user_fixture()
      # Give user insufficient balance
      user = Api.Repo.update!(Ecto.Changeset.change(user, balance: 50))

      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      attrs = %{
        name: "Expensive Plot",
        user_id: user.id,
        polygon: polygon
      }

      # Should fail due to insufficient balance
      assert {:error, :insufficient_balance} = Plot.Service.create_plot(attrs)

      # Verify no plot was created
      assert Api.Repo.get_by(Plot, name: "Expensive Plot") == nil

      # Verify no log was created
      assert Api.Repo.get_by(Log, user_id: user.id, log_type: "plot_created") == nil

      # Verify user balance unchanged
      updated_user = Api.Repo.get!(User, user.id)
      assert updated_user.balance == 50
    end
  end
end
