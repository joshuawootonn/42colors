defmodule Api.Canvas.VoteServiceTest do
  use Api.DataCase

  alias Api.Canvas.Vote.Service, as: VoteService
  alias Api.Canvas.{Plot, Vote}
  alias Api.Accounts.User
  alias Api.Repo

  describe "cast_vote/4" do
    setup do
      # Create two users
      {:ok, voter} = create_user("voter@example.com")
      {:ok, plot_owner} = create_user("owner@example.com")

      # Give both users initial balance
      voter = Repo.get!(User, voter.id)
      plot_owner = Repo.get!(User, plot_owner.id)

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

    test "successfully casts an upvote", %{voter: voter, target_plot: target_plot} do
      assert {:ok, vote} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 10)

      assert vote.user_id == voter.id
      assert vote.plot_id == target_plot.id
      assert vote.vote_type == "upvote"
      assert vote.amount == 10
      assert is_nil(vote.settled_at)

      # Check plot score was updated
      updated_plot = Repo.get!(Plot, target_plot.id)
      assert updated_plot.score == 10
    end

    test "successfully casts a downvote", %{voter: voter, target_plot: target_plot} do
      assert {:ok, vote} = VoteService.cast_vote(voter.id, target_plot.id, "downvote", 5)

      assert vote.vote_type == "downvote"
      assert vote.amount == 5

      # Check plot score was decreased
      updated_plot = Repo.get!(Plot, target_plot.id)
      assert updated_plot.score == -5
    end

    test "allows incremental voting up to 100 pixels", %{voter: voter, target_plot: target_plot} do
      # First vote: 50 pixels
      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 50)

      # Second vote: 30 more pixels (total 80)
      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 30)

      # Third vote: 20 more pixels (total 100 - should succeed)
      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 20)

      # Check total
      total = Vote.Repo.get_user_plot_vote_total(voter.id, target_plot.id)
      assert total == 100

      # Check plot score
      updated_plot = Repo.get!(Plot, target_plot.id)
      assert updated_plot.score == 100

      # Fourth vote: 1 more pixel (total 101 - should fail)
      assert {:error, :vote_amount_exceeded} =
               VoteService.cast_vote(voter.id, target_plot.id, "upvote", 1)
    end

    test "prevents voting without creating a plot first" do
      {:ok, new_user} = create_user("newuser@example.com")
      {:ok, some_plot} = create_plot(new_user.id, "Some Plot")

      {:ok, voter_without_plot} = create_user("noplot@example.com")

      assert {:error, :vote_unauthorized} =
               VoteService.cast_vote(voter_without_plot.id, some_plot.id, "upvote", 10)
    end

    test "prevents voting on own plot", %{voter: voter, voter_plot: voter_plot} do
      assert {:error, :vote_own_plot} =
               VoteService.cast_vote(voter.id, voter_plot.id, "upvote", 10)
    end

    test "prevents switching vote direction", %{voter: voter, target_plot: target_plot} do
      # First vote as upvote
      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 10)

      # Try to downvote - should fail
      assert {:error, :vote_direction_locked} =
               VoteService.cast_vote(voter.id, target_plot.id, "downvote", 5)
    end

    test "checks available balance including unsettled votes", %{
      voter: voter,
      target_plot: target_plot
    } do
      # Voter starts with 4000 pixels (2000 default + 2000 initial grant)
      # Creating eligibility plot costs 100 pixels (10x10 plot)
      # So voter has 3900 available after creating their eligibility plot

      # Cast a vote for 100 pixels (max per plot)
      assert {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 100)

      # Available balance should now be 3800
      # Create third user and plot
      {:ok, third_user} = create_user("third@example.com")
      {:ok, third_plot} = create_plot(third_user.id, "Third Plot")

      # Vote 100 on third plot - should succeed
      assert {:ok, _} = VoteService.cast_vote(voter.id, third_plot.id, "upvote", 100)

      # Create 37 more users and plots, vote 100 on each (total 39 plots * 100 = 3900)
      for i <- 1..37 do
        {:ok, user} = create_user("user#{i}@example.com")
        {:ok, plot} = create_plot(user.id, "Plot #{i}")
        assert {:ok, _} = VoteService.cast_vote(voter.id, plot.id, "upvote", 100)
      end

      # Now voter should have spent 3900 pixels
      # Available balance should be 0
      # Try to vote 1 more pixel - should fail
      {:ok, final_user} = create_user("final@example.com")
      {:ok, final_plot} = create_plot(final_user.id, "Final Plot")

      assert {:error, :vote_insufficient_balance} =
               VoteService.cast_vote(voter.id, final_plot.id, "upvote", 1)
    end

    test "rejects vote on non-existent plot", %{voter: voter} do
      assert {:error, :plot_not_found} =
               VoteService.cast_vote(voter.id, 99999, "upvote", 10)
    end
  end

  describe "settle_daily_votes/0" do
    setup do
      {:ok, voter} = create_user("voter@example.com")
      {:ok, plot_owner} = create_user("owner@example.com")

      voter = Repo.get!(User, voter.id)
      plot_owner = Repo.get!(User, plot_owner.id)

      {:ok, voter_plot} = create_plot(voter.id, "Voter Plot")
      {:ok, target_plot} = create_plot(plot_owner.id, "Target Plot")

      %{
        voter: voter,
        plot_owner: plot_owner,
        voter_plot: voter_plot,
        target_plot: target_plot
      }
    end

    test "settles upvotes and transfers pixels to plot owner", %{
      voter: voter,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      # Cast an upvote
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 100)

      # Record initial balances
      initial_voter_balance = Repo.get!(User, voter.id).balance
      initial_owner_balance = Repo.get!(User, plot_owner.id).balance

      # Settle votes
      assert {:ok, result} = VoteService.settle_daily_votes()
      # Processes both voter (who cast) and owner (who receives)
      assert result.processed_users == 2
      assert result.total_votes == 1

      # Check balances after settlement
      final_voter = Repo.get!(User, voter.id)
      final_owner = Repo.get!(User, plot_owner.id)

      # Voter should have 100 less (paid for vote)
      assert final_voter.balance == initial_voter_balance - 100

      # Owner should have 100 more (received upvote)
      assert final_owner.balance == initial_owner_balance + 100

      # Check vote is marked as settled
      vote = Vote.Repo.get_user_plot_votes(voter.id, target_plot.id) |> List.first()
      refute is_nil(vote.settled_at)
      refute is_nil(vote.settlement_date)
    end

    test "settles downvotes and burns pixels without transferring to owner", %{
      voter: voter,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      # Cast a downvote
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "downvote", 50)

      initial_voter_balance = Repo.get!(User, voter.id).balance
      initial_owner_balance = Repo.get!(User, plot_owner.id).balance

      # Settle votes
      assert {:ok, _} = VoteService.settle_daily_votes()

      final_voter = Repo.get!(User, voter.id)
      final_owner = Repo.get!(User, plot_owner.id)

      # Voter should have 50 less (paid for vote)
      assert final_voter.balance == initial_voter_balance - 50

      # Owner should have SAME balance (downvotes don't transfer)
      assert final_owner.balance == initial_owner_balance
    end

    test "creates daily_vote_aggregate logs with correct structure", %{
      voter: voter,
      plot_owner: plot_owner,
      target_plot: target_plot
    } do
      # Cast votes
      {:ok, _} = VoteService.cast_vote(voter.id, target_plot.id, "upvote", 75)

      # Settle
      assert {:ok, _} = VoteService.settle_daily_votes()

      # Check voter's log (cast side)
      voter_log =
        Api.Logs.Log.Repo.list_by_user(voter.id)
        |> Enum.find(&(&1.log_type == "daily_vote_aggregate"))

      assert voter_log
      assert voter_log.diffs["cast_diffs"]
      assert length(voter_log.diffs["cast_diffs"]) == 1
      cast_diff = List.first(voter_log.diffs["cast_diffs"])
      assert cast_diff["name"] == target_plot.name
      assert cast_diff["old_score"] == 0
      assert cast_diff["new_score"] == 75

      # Check owner's log (receive side)
      owner_log =
        Api.Logs.Log.Repo.list_by_user(plot_owner.id)
        |> Enum.find(&(&1.log_type == "daily_vote_aggregate"))

      assert owner_log
      assert owner_log.diffs["received_diffs"]
      assert length(owner_log.diffs["received_diffs"]) == 1
      received_diff = List.first(owner_log.diffs["received_diffs"])
      assert received_diff["name"] == target_plot.name
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
