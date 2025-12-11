defmodule Api.Canvas.VoteServiceTest do
  use Api.DataCase

  alias Api.Canvas.Vote.Service, as: VoteService
  alias Api.Canvas.Vote
  alias Api.Canvas.Plot
  alias Api.Logs.Log
  alias Api.Repo

  describe "cast_vote/2" do
    setup do
      {:ok, voter} = create_user("voter@example.com")
      {:ok, plot_owner} = create_user("owner@example.com")

      # Create a plot for the voter (required for eligibility)
      {:ok, voter_plot} = create_plot(voter.id, "Voter Plot")

      # Create a plot for the owner (the one being voted on)
      {:ok, target_plot} = create_plot(plot_owner.id, "Target Plot")

      %{
        voter: voter,
        plot_owner: plot_owner,
        voter_plot: voter_plot,
        target_plot: target_plot
      }
    end

    test "successfully casts a vote", %{voter: voter, target_plot: target_plot} do
      assert {:ok, vote} = VoteService.cast_vote(voter.id, target_plot.id)

      assert vote.user_id == voter.id
      assert vote.plot_id == target_plot.id
      assert vote.old_score == 0
      assert is_nil(vote.settled_at)

      # Check plot score was updated by 1
      updated_plot = Repo.get!(Plot, target_plot.id)
      assert updated_plot.score == 1
    end

    test "prevents voting twice on the same plot", %{voter: voter, target_plot: target_plot} do
      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      assert {:error, :already_voted} = VoteService.cast_vote(voter.id, target_plot.id)
    end

    test "prevents voting without creating a plot first" do
      {:ok, new_user} = create_user("newuser@example.com")
      {:ok, some_plot} = create_plot(new_user.id, "Some Plot")

      {:ok, voter_without_plot} = create_user("noplot@example.com")

      assert {:error, :vote_unauthorized} =
               VoteService.cast_vote(voter_without_plot.id, some_plot.id)
    end

    test "prevents voting on own plot", %{voter: voter, voter_plot: voter_plot} do
      assert {:error, :vote_own_plot} = VoteService.cast_vote(voter.id, voter_plot.id)
    end

    test "rejects vote on non-existent plot", %{voter: voter} do
      assert {:error, :plot_not_found} = VoteService.cast_vote(voter.id, 99999)
    end

    test "allows voting on multiple plots", %{voter: voter, target_plot: target_plot} do
      {:ok, another_owner} = create_user("another@example.com")
      {:ok, another_plot} = create_plot(another_owner.id, "Another Plot")

      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      assert {:ok, _} = VoteService.cast_vote(voter.id, another_plot.id)

      # Both plots should have score of 1
      assert Repo.get!(Plot, target_plot.id).score == 1
      assert Repo.get!(Plot, another_plot.id).score == 1
    end
  end

  describe "settle_votes/0" do
    setup do
      {:ok, voter} = create_user("voter@example.com")
      {:ok, voter2} = create_user("voter2@example.com")
      {:ok, plot_owner} = create_user("owner@example.com")

      {:ok, voter_plot} = create_plot(voter.id, "Voter Plot")
      {:ok, voter2_plot} = create_plot(voter2.id, "Voter2 Plot")
      {:ok, target_plot} = create_plot(plot_owner.id, "Target Plot")

      %{
        voter: voter,
        voter2: voter2,
        plot_owner: plot_owner,
        voter_plot: voter_plot,
        voter2_plot: voter2_plot,
        target_plot: target_plot
      }
    end

    test "returns no_votes_to_settle when no unsettled votes exist" do
      assert {:ok, :no_votes_to_settle} = VoteService.settle_votes()
    end

    test "marks votes as settled", %{voter: voter, target_plot: target_plot} do
      {:ok, vote} = VoteService.cast_vote(voter.id, target_plot.id)
      assert is_nil(vote.settled_at)

      {:ok, %{total_votes: 1}} = VoteService.settle_votes()

      # Reload vote and check it's settled
      settled_vote = Repo.get!(Vote, vote.id)
      refute is_nil(settled_vote.settled_at)
      refute is_nil(settled_vote.settlement_date)
    end

    test "creates log for voter with votes_cast", %{voter: voter, target_plot: target_plot} do
      {:ok, _vote} = VoteService.cast_vote(voter.id, target_plot.id)

      {:ok, _} = VoteService.settle_votes()

      # Find the voter's log
      voter_log =
        Log.Repo.list_by_user(voter.id)
        |> Enum.find(&(&1.log_type == "vote_aggregate"))

      assert voter_log
      assert voter_log.diffs["votesCast"]
      assert length(voter_log.diffs["votesCast"]) == 1

      vote_cast = List.first(voter_log.diffs["votesCast"])
      assert vote_cast["plotId"] == target_plot.id
      assert vote_cast["name"] == target_plot.name
      assert vote_cast["oldScore"] == 0
      assert vote_cast["newScore"] == 1
    end

    test "creates log for plot owner with votes_received", %{
      voter: voter,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      {:ok, _vote} = VoteService.cast_vote(voter.id, target_plot.id)

      {:ok, _} = VoteService.settle_votes()

      # Find the plot owner's log
      owner_log =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.find(&(&1.log_type == "vote_aggregate"))

      assert owner_log
      assert owner_log.diffs["votesReceived"]
      assert length(owner_log.diffs["votesReceived"]) == 1

      vote_received = List.first(owner_log.diffs["votesReceived"])
      assert vote_received["plotId"] == target_plot.id
      assert vote_received["name"] == target_plot.name
      assert vote_received["oldScore"] == 0
      assert vote_received["newScore"] == 1
      assert vote_received["voteCount"] == 1
    end

    test "handles multiple votes on the same plot", %{
      voter: voter,
      voter2: voter2,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      # Both vote on target_plot
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.cast_vote(voter2.id, target_plot.id)

      {:ok, %{total_votes: 2, processed_users: 3}} = VoteService.settle_votes()

      # Check plot owner's votes_received shows both votes
      owner_log =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.find(&(&1.log_type == "vote_aggregate"))

      vote_received = List.first(owner_log.diffs["votesReceived"])
      assert vote_received["oldScore"] == 0
      assert vote_received["newScore"] == 2
      assert vote_received["voteCount"] == 2
    end

    test "voter balance unchanged (votes are free to cast)", %{
      voter: voter,
      target_plot: target_plot
    } do
      initial_balance = Repo.get!(Api.Accounts.User, voter.id).balance

      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()

      final_balance = Repo.get!(Api.Accounts.User, voter.id).balance
      assert initial_balance == final_balance
    end

    test "plot owner receives 100 pixels per vote", %{
      voter: voter,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      initial_owner_balance = Repo.get!(Api.Accounts.User, plot_owner.id).balance

      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()

      final_owner_balance = Repo.get!(Api.Accounts.User, plot_owner.id).balance
      assert final_owner_balance == initial_owner_balance + 100
    end

    test "plot owner receives 100 pixels per vote from multiple voters", %{
      voter: voter,
      voter2: voter2,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      # Create one more voter
      {:ok, voter3} = create_user("voter3@example.com")
      {:ok, _} = create_plot(voter3.id, "Voter3 Plot")

      initial_owner_balance = Repo.get!(Api.Accounts.User, plot_owner.id).balance

      # All three vote on the same plot
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.cast_vote(voter2.id, target_plot.id)
      {:ok, _} = VoteService.cast_vote(voter3.id, target_plot.id)

      {:ok, _} = VoteService.settle_votes()

      final_owner_balance = Repo.get!(Api.Accounts.User, plot_owner.id).balance
      # 3 votes * 100 pixels = 300
      assert final_owner_balance == initial_owner_balance + 300
    end

    test "only settles unsettled votes", %{voter: voter, target_plot: target_plot} do
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)

      {:ok, %{total_votes: 1}} = VoteService.settle_votes()

      # Second call should find no unsettled votes
      assert {:ok, :no_votes_to_settle} = VoteService.settle_votes()
    end

    test "incremental settlement appends to existing log when last log is vote_aggregate from today",
         %{
           voter: voter,
           voter2: voter2,
           plot_owner: plot_owner,
           target_plot: target_plot
         } do
      # First vote and settle - creates vote_aggregate log
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()

      owner_logs_after_first =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.filter(&(&1.log_type == "vote_aggregate"))

      assert length(owner_logs_after_first) == 1
      first_log = List.first(owner_logs_after_first)
      assert length(first_log.diffs["votesReceived"]) == 1
      first_log_id = first_log.id

      # Second vote and settle - should append since last log for plot_owner is vote_aggregate from today
      {:ok, _} = VoteService.cast_vote(voter2.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()

      owner_logs_after_second =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.filter(&(&1.log_type == "vote_aggregate"))

      # Should still be just one vote_aggregate log (appended, not duplicated)
      assert length(owner_logs_after_second) == 1
      second_log = List.first(owner_logs_after_second)
      assert second_log.id == first_log_id
      # Now has 2 entries in votesReceived (one per settlement batch)
      assert length(second_log.diffs["votesReceived"]) == 2
    end

    test "creates new log when last log is not vote_aggregate", %{
      voter: voter,
      voter2: voter2,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      # At this point, plot_owner's last log is plot_created from setup

      # Vote and settle - should create a new vote_aggregate (last log was plot_created)
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()

      owner_logs =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.filter(&(&1.log_type == "vote_aggregate"))

      assert length(owner_logs) == 1

      # Now create a new plot (creates plot_created log, making it the last log)
      {:ok, _new_plot} = create_plot(plot_owner.id, "Another Plot")

      # Vote and settle - should create NEW vote_aggregate (last log was plot_created)
      {:ok, _} = VoteService.cast_vote(voter2.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()

      owner_logs_after =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.filter(&(&1.log_type == "vote_aggregate"))

      # Should now have 2 vote_aggregate logs (the plot_created broke the aggregation)
      assert length(owner_logs_after) == 2
    end

    test "incremental settlement correctly accumulates balance", %{
      voter: voter,
      voter2: voter2,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      initial_owner_balance = Repo.get!(Api.Accounts.User, plot_owner.id).balance

      # First vote and settle - owner gets +100
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()
      balance_after_first = Repo.get!(Api.Accounts.User, plot_owner.id).balance
      assert balance_after_first == initial_owner_balance + 100

      # Second vote and settle - owner gets another +100
      {:ok, _} = VoteService.cast_vote(voter2.id, target_plot.id)
      {:ok, _} = VoteService.settle_votes()
      balance_after_second = Repo.get!(Api.Accounts.User, plot_owner.id).balance
      assert balance_after_second == initial_owner_balance + 200

      # Check log has correct old/new balance (single log with accumulated values)
      owner_log =
        Log.Repo.list_by_user(plot_owner.id)
        |> Enum.find(&(&1.log_type == "vote_aggregate"))

      assert owner_log.old_balance == initial_owner_balance
      assert owner_log.new_balance == initial_owner_balance + 200
    end
  end

  # Helper functions

  defp create_user(email) do
    Api.Accounts.register_user(%{
      email: email,
      password: "ValidPassword123!"
    })
  end

  defp create_plot(user_id, name) do
    polygon = %Geo.Polygon{
      coordinates: [
        [
          {0.0, 0.0},
          {10.0, 0.0},
          {10.0, 10.0},
          {0.0, 10.0},
          {0.0, 0.0}
        ]
      ],
      srid: 4326
    }

    Api.Canvas.Plot.Service.create_plot(%{
      user_id: user_id,
      name: name,
      polygon: polygon
    })
  end
end
