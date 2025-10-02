defmodule ApiWeb.LogControllerTest do
  use ApiWeb.ConnCase

  import Api.AccountsFixtures
  import Api.CanvasFixtures

  alias Api.Logs.Log

  setup %{conn: conn} do
    user = user_fixture()
    # Give user sufficient balance for operations
    user = Api.Repo.update!(Ecto.Changeset.change(user, balance: 1000))
    conn = log_in_user(conn, user)
    {:ok, conn: conn, user: user}
  end

  describe "me_logs" do
    test "returns initial grant log for new user", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/logs/me")
      response = json_response(conn, 200)["data"]

      # New users automatically get an initial grant log
      assert length(response) == 1
      initial_log = List.first(response)
      assert initial_log["logType"] == "initial_grant"
      assert initial_log["userId"] == user.id
      assert initial_log["newBalance"] > initial_log["oldBalance"]
    end

    test "returns user's logs with correct structure", %{conn: conn, user: user} do
      # Create a plot to generate logs
      plot = plot_fixture(%{user_id: user.id})

      # Create some logs manually for testing
      {:ok, log1} =
        Log.Repo.create(%{
          user_id: user.id,
          old_balance: 1000,
          new_balance: 900,
          log_type: "plot_created",
          plot_id: plot.id,
          diffs: %{plotName: plot.name, cost: 100}
        })

      {:ok, log2} =
        Log.Repo.create(%{
          user_id: user.id,
          old_balance: 500,
          new_balance: 1000,
          log_type: "bailout_grant",
          diffs: %{reason: "Welcome bonus", amount: 500}
        })

      conn = get(conn, ~p"/api/logs/me")
      response = json_response(conn, 200)["data"]

      # Should have initial grant + 2 manually created logs = 3 total
      assert length(response) == 3

      # Check that logs are returned with correct structure
      log_ids = Enum.map(response, & &1["id"])
      assert log1.id in log_ids
      assert log2.id in log_ids

      # Find the plot_created log and verify its structure
      plot_log = Enum.find(response, &(&1["logType"] == "plot_created"))
      assert plot_log["userId"] == user.id
      assert plot_log["oldBalance"] == 1000
      assert plot_log["newBalance"] == 900
      assert plot_log["plotId"] == plot.id
      assert plot_log["diffs"]["plotName"] == plot.name
      assert plot_log["diffs"]["cost"] == 100
      assert plot_log["plot"]["id"] == plot.id
      assert plot_log["plot"]["name"] == plot.name

      # Find the bailout_grant log and verify its structure
      grant_log = Enum.find(response, &(&1["logType"] == "bailout_grant"))
      assert grant_log["userId"] == user.id
      assert grant_log["oldBalance"] == 500
      assert grant_log["newBalance"] == 1000
      assert grant_log["plotId"] == nil
      assert grant_log["diffs"]["reason"] == "Welcome bonus"
      assert grant_log["diffs"]["amount"] == 500
      assert grant_log["plot"] == nil
    end

    test "only returns logs for the current user", %{conn: conn, user: user} do
      # Create another user and their logs
      other_user = user_fixture()
      other_user = Api.Repo.update!(Ecto.Changeset.change(other_user, balance: 500))

      # Create logs for current user (in addition to automatic initial grant)
      {:ok, _user_log} =
        Log.Repo.create(%{
          user_id: user.id,
          old_balance: 1000,
          new_balance: 900,
          log_type: "plot_created"
        })

      # Create logs for other user (in addition to their automatic initial grant)
      {:ok, _other_log} =
        Log.Repo.create(%{
          user_id: other_user.id,
          old_balance: 500,
          new_balance: 400,
          log_type: "plot_created"
        })

      conn = get(conn, ~p"/api/logs/me")
      response = json_response(conn, 200)["data"]

      # Should have initial grant + 1 manual log = 2 total for current user
      assert length(response) == 2

      # All logs should belong to current user
      user_ids = Enum.map(response, & &1["userId"])
      assert Enum.all?(user_ids, &(&1 == user.id))
    end

    test "respects limit parameter", %{conn: conn, user: user} do
      # Create multiple logs (in addition to automatic initial grant)
      for i <- 1..5 do
        {:ok, _log} =
          Log.Repo.create(%{
            user_id: user.id,
            old_balance: 1000 - i * 10,
            new_balance: 1000 - (i + 1) * 10,
            log_type: "plot_created"
          })

        Process.sleep(1)
      end

      # Test limit of 3
      conn = get(conn, ~p"/api/logs/me?limit=3")
      response = json_response(conn, 200)["data"]
      assert length(response) == 3
    end

    test "handles limit of 0", %{conn: conn} do
      conn = get(conn, ~p"/api/logs/me?limit=0")
      response = json_response(conn, 200)["data"]
      assert response == []
    end

    test "handles invalid limit by using default", %{conn: conn, user: user} do
      # Create a log (in addition to automatic initial grant)
      {:ok, _log} =
        Log.Repo.create(%{
          user_id: user.id,
          old_balance: 1000,
          new_balance: 900,
          log_type: "plot_created"
        })

      conn = get(conn, ~p"/api/logs/me?limit=invalid")
      response = json_response(conn, 200)["data"]
      # Should use default limit and return results (initial grant + manual log = 2)
      assert is_list(response)
      assert length(response) == 2
    end

    test "includes plot information when plot_id is present", %{conn: conn, user: user} do
      plot = plot_fixture(%{user_id: user.id, name: "Test Plot", description: "Test Description"})

      {:ok, _log} =
        Log.Repo.create(%{
          user_id: user.id,
          old_balance: 1000,
          new_balance: 900,
          log_type: "plot_created",
          plot_id: plot.id
        })

      conn = get(conn, ~p"/api/logs/me")
      response = json_response(conn, 200)["data"]

      # Should have initial grant + plot creation log = 2 total
      assert length(response) == 2

      # Find the plot creation log
      plot_log = Enum.find(response, &(&1["logType"] == "plot_created"))
      assert plot_log["plot"]["id"] == plot.id
      assert plot_log["plot"]["name"] == "Test Plot"
      assert plot_log["plot"]["description"] == "Test Description"

      # Initial grant log should have no plot
      initial_log = Enum.find(response, &(&1["logType"] == "initial_grant"))
      assert initial_log["plot"] == nil
    end

    test "handles different log types correctly", %{conn: conn, user: user} do
      plot = plot_fixture(%{user_id: user.id})

      # Create logs of different types (in addition to automatic initial grant)
      log_types = [
        {"bailout_grant", %{reason: "Emergency", amount: 100}},
        {"plot_created", %{plotName: "New Plot", cost: 200}},
        {"plot_updated", %{nameChanged: true, oldName: "Old", newName: "New"}},
        {"plot_deleted", %{plotName: "Deleted Plot", refund: 150}}
      ]

      for {log_type, diffs} <- log_types do
        {:ok, _log} =
          Log.Repo.create(%{
            user_id: user.id,
            old_balance: 1000,
            new_balance: if(String.contains?(log_type, "grant"), do: 1100, else: 900),
            log_type: log_type,
            plot_id: if(String.contains?(log_type, "plot"), do: plot.id, else: nil),
            diffs: diffs
          })
      end

      conn = get(conn, ~p"/api/logs/me")
      response = json_response(conn, 200)["data"]

      # Should have initial grant + 4 manual logs = 5 total
      assert length(response) == 5

      # Verify all log types are present (including automatic initial_grant)
      returned_types = Enum.map(response, & &1["logType"])
      assert "initial_grant" in returned_types

      for {log_type, _} <- log_types do
        assert log_type in returned_types
      end
    end
  end
end
