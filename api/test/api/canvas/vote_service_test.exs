defmodule Api.Canvas.VoteServiceTest do
  use Api.DataCase

  alias Api.Canvas.Vote.Service, as: VoteService
  alias Api.Canvas.Plot
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
