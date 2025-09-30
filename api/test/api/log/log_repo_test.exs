defmodule Api.Logs.Log.RepoTest do
  use Api.DataCase, async: true

  alias Api.Logs.Log.Repo, as: LogRepo
  alias Api.Logs.Log
  alias Api.Accounts.User

  describe "get/1" do
    test "returns log by id" do
      user = insert_user()
      log = insert_log(user_id: user.id)

      assert %Log{} = found = LogRepo.get(log.id)
      assert found.id == log.id
      assert found.amount == log.amount
    end

    test "returns nil when log does not exist" do
      assert LogRepo.get(999_999) == nil
    end
  end

  describe "get!/1" do
    test "returns log by id" do
      user = insert_user()
      log = insert_log(user_id: user.id)

      assert %Log{} = found = LogRepo.get!(log.id)
      assert found.id == log.id
    end

    test "raises Ecto.NoResultsError when log does not exist" do
      assert_raise Ecto.NoResultsError, fn ->
        LogRepo.get!(999_999)
      end
    end
  end

  describe "list/1" do
    test "returns all logs with default options" do
      user = insert_user()
      log1 = insert_log(user_id: user.id, amount: 100)
      log2 = insert_log(user_id: user.id, amount: -50)

      logs = LogRepo.list()

      assert length(logs) == 2
      assert Enum.any?(logs, fn t -> t.id == log1.id end)
      assert Enum.any?(logs, fn t -> t.id == log2.id end)
    end

    test "returns logs ordered by inserted_at desc by default" do
      user = insert_user()
      log1 = insert_log(user_id: user.id, amount: 100)
      log2 = insert_log(user_id: user.id, amount: -50)

      logs = LogRepo.list()

      # Logs should be ordered by inserted_at desc
      # Verify that each log's inserted_at is >= the next one
      for i <- 0..(length(logs) - 2) do
        current = Enum.at(logs, i)
        next_tx = Enum.at(logs, i + 1)
        assert DateTime.compare(current.inserted_at, next_tx.inserted_at) in [:gt, :eq]
      end

      # Verify our logs are in the list
      ids = Enum.map(logs, & &1.id)
      assert log1.id in ids
      assert log2.id in ids
    end

    test "filters by user_id" do
      user1 = insert_user()
      user2 = insert_user()
      log1 = insert_log(user_id: user1.id)
      _log2 = insert_log(user_id: user2.id)

      logs = LogRepo.list(user_id: user1.id)

      assert length(logs) == 1
      assert hd(logs).id == log1.id
    end

    test "filters by plot_id" do
      user = insert_user()
      plot = insert_plot(user_id: user.id)
      log1 = insert_log(user_id: user.id, plot_id: plot.id)
      _log2 = insert_log(user_id: user.id, plot_id: nil)

      logs = LogRepo.list(plot_id: plot.id)

      assert length(logs) == 1
      assert hd(logs).id == log1.id
    end

    test "filters by log_type" do
      user = insert_user()
      log1 = insert_log(user_id: user.id, log_type: "plot_created")
      _log2 = insert_log(user_id: user.id, log_type: "plot_deleted")

      logs = LogRepo.list(log_type: "plot_created")

      assert length(logs) == 1
      assert hd(logs).id == log1.id
    end

    test "respects limit option" do
      user = insert_user()
      insert_log(user_id: user.id)
      insert_log(user_id: user.id)
      insert_log(user_id: user.id)

      logs = LogRepo.list(limit: 2)

      assert length(logs) == 2
    end

    test "respects offset option" do
      user = insert_user()
      insert_log(user_id: user.id, amount: 100)
      insert_log(user_id: user.id, amount: 200)
      insert_log(user_id: user.id, amount: 300)

      # Get all logs for this user
      all_logs = LogRepo.list_by_user(user.id)
      assert length(all_logs) == 3

      # With offset 1, we should skip the first one and get 2 results
      logs_with_offset = LogRepo.list_by_user(user.id, limit: 2, offset: 1)

      assert length(logs_with_offset) == 2
      # The results should be different from the first result without offset
      first_without_offset = List.first(all_logs)
      refute Enum.any?(logs_with_offset, fn t -> t.id == first_without_offset.id end)
    end

    test "supports custom ordering" do
      user = insert_user()
      _log1 = insert_log(user_id: user.id, amount: 100)
      log2 = insert_log(user_id: user.id, amount: -50)

      logs = LogRepo.list(order_by: :amount, order_dir: :asc)

      assert hd(logs).id == log2.id
    end

    test "preloads associations when specified" do
      user = insert_user()
      plot = insert_plot(user_id: user.id)
      log = insert_log(user_id: user.id, plot_id: plot.id)

      [loaded_log] = LogRepo.list(preload: [:plot])

      assert loaded_log.id == log.id
      assert %Api.Canvas.Plot{} = loaded_log.plot
      assert loaded_log.plot.id == plot.id
    end

    test "applies default limit of 50" do
      user = insert_user()

      # Insert more than 50 logs
      for _ <- 1..60 do
        insert_log(user_id: user.id)
      end

      logs = LogRepo.list()

      assert length(logs) == 50
    end
  end

  describe "list_by_user/2" do
    test "returns logs for specific user" do
      user1 = insert_user()
      user2 = insert_user()
      log1 = insert_log(user_id: user1.id)
      _log2 = insert_log(user_id: user2.id)

      logs = LogRepo.list_by_user(user1.id)

      assert length(logs) == 1
      assert hd(logs).id == log1.id
    end

    test "supports options like limit and preload" do
      user = insert_user()
      plot = insert_plot(user_id: user.id)
      insert_log(user_id: user.id, plot_id: plot.id)
      insert_log(user_id: user.id, plot_id: plot.id)

      logs = LogRepo.list_by_user(user.id, limit: 1, preload: [:plot])

      assert length(logs) == 1
      assert %Api.Canvas.Plot{} = hd(logs).plot
    end
  end

  describe "list_by_plot/2" do
    test "returns logs for specific plot" do
      user = insert_user()
      plot1 = insert_plot(user_id: user.id)
      plot2 = insert_plot(user_id: user.id)
      log1 = insert_log(user_id: user.id, plot_id: plot1.id)
      _log2 = insert_log(user_id: user.id, plot_id: plot2.id)

      logs = LogRepo.list_by_plot(plot1.id)

      assert length(logs) == 1
      assert hd(logs).id == log1.id
    end
  end

  describe "create/1" do
    test "creates log with valid attributes" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        amount: 100,
        log_type: "plot_created"
      }

      assert {:ok, %Log{} = log} = LogRepo.create(attrs)
      assert log.user_id == user.id
      assert log.amount == 100
      assert log.log_type == "plot_created"
    end

    test "creates log with metadata" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        amount: 100,
        log_type: "plot_created",
        metadata: %{pixel_count: 100, note: "test"}
      }

      assert {:ok, %Log{} = log} = LogRepo.create(attrs)

      assert log.metadata[:pixel_count] == 100 ||
               log.metadata["pixel_count"] == 100

      assert log.metadata[:note] == "test" || log.metadata["note"] == "test"
    end

    test "creates log with plot_id" do
      user = insert_user()
      plot = insert_plot(user_id: user.id)

      attrs = %{
        user_id: user.id,
        amount: -100,
        log_type: "plot_created",
        plot_id: plot.id
      }

      assert {:ok, %Log{} = log} = LogRepo.create(attrs)
      assert log.plot_id == plot.id
    end

    test "returns error changeset with invalid attributes" do
      attrs = %{amount: 100}

      assert {:error, %Ecto.Changeset{} = changeset} = LogRepo.create(attrs)
      assert changeset.errors[:user_id]
      assert changeset.errors[:log_type]
    end

    test "returns error when amount is zero" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        amount: 0,
        log_type: "plot_created"
      }

      assert {:error, %Ecto.Changeset{} = changeset} = LogRepo.create(attrs)
      assert changeset.errors[:amount]
    end

    test "returns error with invalid log_type" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        amount: 100,
        log_type: "invalid_type"
      }

      assert {:error, %Ecto.Changeset{} = changeset} = LogRepo.create(attrs)
      assert changeset.errors[:log_type]
    end

    test "creates log with negative amount" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        amount: -100,
        log_type: "plot_created"
      }

      assert {:ok, %Log{} = log} = LogRepo.create(attrs)
      assert log.amount == -100
    end
  end

  describe "create!/1" do
    test "creates log with valid attributes" do
      user = insert_user()

      attrs = %{
        user_id: user.id,
        amount: 100,
        log_type: "plot_created"
      }

      assert %Log{} = log = LogRepo.create!(attrs)
      assert log.user_id == user.id
      assert log.amount == 100
    end

    test "raises error with invalid attributes" do
      attrs = %{amount: 100}

      assert_raise Ecto.InvalidChangesetError, fn ->
        LogRepo.create!(attrs)
      end
    end
  end

  describe "update/2" do
    test "updates log metadata" do
      user = insert_user()
      log = insert_log(user_id: user.id)

      attrs = %{metadata: %{updated: true}}

      assert {:ok, %Log{} = updated} = LogRepo.update(log, attrs)
      assert updated.metadata[:updated] == true || updated.metadata["updated"] == true
    end

    test "returns error with invalid update" do
      user = insert_user()
      log = insert_log(user_id: user.id)

      attrs = %{amount: 0}

      assert {:error, %Ecto.Changeset{}} = LogRepo.update(log, attrs)
    end
  end

  describe "delete/1" do
    test "deletes log" do
      user = insert_user()
      log = insert_log(user_id: user.id)

      assert {:ok, %Log{}} = LogRepo.delete(log)
      assert LogRepo.get(log.id) == nil
    end
  end

  describe "sum_by_user/1" do
    test "returns sum of log amounts for user" do
      user = insert_user()
      insert_log(user_id: user.id, amount: 100)
      insert_log(user_id: user.id, amount: -50)
      insert_log(user_id: user.id, amount: 25)

      assert LogRepo.sum_by_user(user.id) == 75
    end

    test "returns 0 when user has no logs" do
      user = insert_user()

      assert LogRepo.sum_by_user(user.id) == 0
    end

    test "returns 0 for non-existent user" do
      assert LogRepo.sum_by_user(999_999) == 0
    end
  end

  describe "count/1" do
    test "counts all logs" do
      user = insert_user()
      insert_log(user_id: user.id)
      insert_log(user_id: user.id)

      assert LogRepo.count() == 2
    end

    test "counts logs filtered by user_id" do
      user1 = insert_user()
      user2 = insert_user()
      insert_log(user_id: user1.id)
      insert_log(user_id: user1.id)
      insert_log(user_id: user2.id)

      assert LogRepo.count(user_id: user1.id) == 2
    end

    test "counts logs filtered by log_type" do
      user = insert_user()
      insert_log(user_id: user.id, log_type: "plot_created")
      insert_log(user_id: user.id, log_type: "plot_deleted")
      insert_log(user_id: user.id, log_type: "plot_created")

      assert LogRepo.count(log_type: "plot_created") == 2
    end

    test "returns 0 when no logs match filters" do
      assert LogRepo.count(user_id: 999_999) == 0
    end
  end

  # Helper functions

  defp insert_user do
    %User{}
    |> User.registration_changeset(%{
      email: "user#{System.unique_integer()}@example.com",
      password: "password1234!@#$"
    })
    |> Api.Repo.insert!()
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

  defp insert_log(attrs) do
    default_attrs = %{
      amount: 100,
      log_type: "plot_created",
      metadata: %{}
    }

    attrs = Map.merge(default_attrs, Map.new(attrs))

    %Log{}
    |> Log.changeset(attrs)
    |> Api.Repo.insert!()
  end
end
