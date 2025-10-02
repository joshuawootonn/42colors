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
      # Verify balance tracking
      assert log.old_balance == 1000
      assert log.new_balance == 900
      # Negative because user spent currency (new_balance - old_balance)
      balance_diff = log.new_balance - log.old_balance
      assert balance_diff == -100

      # Verify diffs map tracks what was created
      assert log.diffs["name"]["old"] == nil
      assert log.diffs["name"]["new"] == "Test Plot"
      assert log.diffs["description"]["old"] == nil
      assert log.diffs["description"]["new"] == "Test Description"
      assert log.diffs["polygon"]["old_pixel_count"] == 0
      assert log.diffs["polygon"]["new_pixel_count"] == 100

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
      # Verify balance tracking (no change for metadata-only update)
      assert update_log.old_balance == 900
      assert update_log.new_balance == 900
      balance_diff = update_log.new_balance - update_log.old_balance
      assert balance_diff == 0

      # Verify diffs map tracks what was updated
      assert update_log.diffs["name"]["old"] == "Original Plot"
      assert update_log.diffs["name"]["new"] == "Updated Plot"
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
      # Verify balance tracking (positive because user got refund)
      assert delete_log.old_balance == 900
      assert delete_log.new_balance == 1000
      balance_diff = delete_log.new_balance - delete_log.old_balance
      assert balance_diff == 100

      # Verify diffs map shows deletion
      assert delete_log.diffs["deleted_at"]["old"] == nil
      # Should have a timestamp
      assert delete_log.diffs["deleted_at"]["new"] != nil

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
