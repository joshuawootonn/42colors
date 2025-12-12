defmodule Api.Canvas.Vote.Service do
  @moduledoc """
  Service layer for vote operations.

  Simplified voting: one upvote per user per plot, free to cast.
  """

  import Ecto.Query, warn: false
  alias Api.Repo
  alias Api.Canvas.Vote
  alias Api.Canvas.Plot
  alias Api.Logs.Log.Service, as: LogService
  alias Ecto.Multi

  @doc """
  Cast an upvote on a plot.

  ## Parameters

    * `user_id` - The user casting the vote
    * `plot_id` - The plot being voted on

  ## Returns

    * `{:ok, vote}` - Vote was cast successfully
    * `{:error, reason}` - Vote failed due to validation error

  ## Error Reasons

    * `:vote_unauthorized` - User hasn't created any plots
    * `:plot_not_found` - Plot doesn't exist
    * `:vote_own_plot` - Can't vote on your own plot
    * `:already_voted` - User has already voted on this plot
  """
  def cast_vote(user_id, plot_id) do
    with {:ok, :eligible} <- check_eligibility(user_id),
         {:ok, plot} <- get_plot(plot_id),
         {:ok, :not_own_plot} <- check_not_own_plot(user_id, plot),
         {:ok, :not_already_voted} <- check_not_already_voted(user_id, plot_id) do
      create_vote_and_update_score(user_id, plot_id)
    end
  end

  # Private functions

  defp check_eligibility(user_id) do
    if Vote.Repo.has_user_created_plot?(user_id) do
      {:ok, :eligible}
    else
      {:error, :vote_unauthorized}
    end
  end

  defp get_plot(plot_id) do
    case Repo.get(Plot, plot_id) do
      nil ->
        {:error, :plot_not_found}

      plot ->
        if is_nil(plot.deleted_at) do
          {:ok, plot}
        else
          {:error, :plot_not_found}
        end
    end
  end

  defp check_not_own_plot(user_id, plot) do
    if plot.user_id == user_id do
      {:error, :vote_own_plot}
    else
      {:ok, :not_own_plot}
    end
  end

  defp check_not_already_voted(user_id, plot_id) do
    if Vote.Repo.has_user_voted_on_plot?(user_id, plot_id) do
      {:error, :already_voted}
    else
      {:ok, :not_already_voted}
    end
  end

  defp create_vote_and_update_score(user_id, plot_id) do
    Multi.new()
    |> Multi.run(:plot, fn _repo, _changes ->
      {:ok, Repo.get!(Plot, plot_id)}
    end)
    |> Multi.insert(:vote, fn %{plot: plot} ->
      Vote.changeset(%Vote{}, %{
        user_id: user_id,
        plot_id: plot_id,
        old_score: plot.score
      })
    end)
    |> Multi.run(:update_plot_score, fn _repo, %{plot: plot} ->
      new_score = plot.score + 1

      plot
      |> Plot.changeset(%{score: new_score})
      |> Repo.update()
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{vote: vote, update_plot_score: _plot}} ->
        {:ok, vote}

      {:error, :vote, changeset, _changes} ->
        {:error, changeset}

      {:error, _failed_operation, reason, _changes} ->
        {:error, reason}
    end
  end

  @doc """
  Settle unsettled votes for all users.

  Called by the Oban VoteSettlementWorker or manually via Mix task.
  Marks votes as settled and creates/updates log entries.

  If the user's last log is a vote_aggregate from the same day, the new votes
  will be appended to that log. Otherwise, a new vote_aggregate log is created.
  """
  def settle_votes do
    # Get all unsettled votes
    votes = Vote.Repo.get_unsettled_votes()

    if Enum.empty?(votes) do
      {:ok, :no_votes_to_settle}
    else
      settled_at = DateTime.utc_now()
      today = Date.utc_today()

      # Group votes by voter
      votes_by_voter = Enum.group_by(votes, & &1.user_id)

      # Find plot owners who received votes
      plot_ids = Enum.map(votes, & &1.plot_id) |> Enum.uniq()
      plots = from(p in Plot, where: p.id in ^plot_ids) |> Repo.all()
      plots_by_id = Map.new(plots, &{&1.id, &1})
      plot_owner_ids = Enum.map(plots, & &1.user_id) |> Enum.uniq()

      # All affected user IDs (voters + plot owners)
      all_user_ids = (Map.keys(votes_by_voter) ++ plot_owner_ids) |> Enum.uniq()

      # Process each user
      results =
        Enum.map(all_user_ids, fn user_id ->
          user_cast_votes = Map.get(votes_by_voter, user_id, [])
          settle_user_votes(user_id, user_cast_votes, votes, plots_by_id)
        end)

      # Mark all votes as settled
      vote_ids = Enum.map(votes, & &1.id)
      Vote.Repo.mark_votes_settled(vote_ids, settled_at, today)

      failures =
        Enum.filter(results, fn
          {:ok, _} -> false
          {:error, _} -> true
        end)

      if Enum.empty?(failures) do
        {:ok,
         %{
           processed_users: length(all_user_ids),
           total_votes: length(votes)
         }}
      else
        {:error, %{failures: failures, processed_users: length(all_user_ids)}}
      end
    end
  end

  @pixels_per_vote 1000

  defp settle_user_votes(user_id, user_cast_votes, all_votes, plots_by_id) do
    user = Repo.get!(Api.Accounts.User, user_id)

    # Calculate votes this user cast - use old_score captured at cast time
    votes_cast =
      Enum.map(user_cast_votes, fn vote ->
        plot = Map.get(plots_by_id, vote.plot_id)

        %{
          plotId: plot.id,
          name: plot.name,
          oldScore: vote.old_score,
          newScore: vote.old_score + 1
        }
      end)

    # Calculate votes received on this user's plots
    user_plot_ids =
      plots_by_id
      |> Map.values()
      |> Enum.filter(&(&1.user_id == user_id))
      |> Enum.map(& &1.id)

    received_vote_records = Enum.filter(all_votes, &(&1.plot_id in user_plot_ids))
    total_votes_received = length(received_vote_records)

    # Group votes by plot and sort by timestamp to show accurate progression
    votes_received =
      received_vote_records
      |> Enum.group_by(& &1.plot_id)
      |> Enum.map(fn {plot_id, votes} ->
        plot = Map.get(plots_by_id, plot_id)
        sorted_votes = Enum.sort_by(votes, & &1.inserted_at, DateTime)
        first_vote = List.first(sorted_votes)
        last_vote = List.last(sorted_votes)

        %{
          plotId: plot.id,
          name: plot.name,
          oldScore: first_vote.old_score,
          newScore: last_vote.old_score + 1,
          voteCount: length(votes)
        }
      end)

    # Skip if no activity for this user
    if Enum.empty?(votes_cast) and Enum.empty?(votes_received) do
      {:ok, :no_activity}
    else
      # Calculate balance change: +100 pixels per vote received
      pixels_earned = total_votes_received * @pixels_per_vote

      # Check if last log is a vote_aggregate from today - if so, update it
      last_log = Api.Logs.Log.Repo.get_last_log(user_id)
      today = Date.utc_today()

      existing_log =
        case last_log do
          %{log_type: "vote_aggregate", inserted_at: inserted_at} ->
            if Date.compare(DateTime.to_date(inserted_at), today) == :eq do
              last_log
            else
              nil
            end

          _ ->
            nil
        end

      upsert_vote_aggregate_log(
        user,
        existing_log,
        pixels_earned,
        votes_cast,
        votes_received
      )
    end
  end

  defp upsert_vote_aggregate_log(user, nil, pixels_earned, votes_cast, votes_received) do
    # No existing log - create new one
    new_balance = user.balance + pixels_earned

    LogService.create_log(%{
      user_id: user.id,
      old_balance: user.balance,
      new_balance: new_balance,
      log_type: "vote_aggregate",
      diffs: %{
        votesCast: votes_cast,
        votesReceived: votes_received
      }
    })
  end

  defp upsert_vote_aggregate_log(
         user,
         existing_log,
         pixels_earned,
         votes_cast,
         votes_received
       ) do
    # Existing log found - append new votes to existing arrays
    existing_diffs = existing_log.diffs || %{}
    existing_votes_cast = Map.get(existing_diffs, "votesCast", [])
    existing_votes_received = Map.get(existing_diffs, "votesReceived", [])

    merged_votes_cast = existing_votes_cast ++ votes_cast
    merged_votes_received = existing_votes_received ++ votes_received

    # Keep old_balance from original log, update new_balance with additional pixels
    new_balance = existing_log.new_balance + pixels_earned

    # Update the log and user balance
    Multi.new()
    |> Multi.update(
      :log,
      Api.Logs.Log.changeset(existing_log, %{
        new_balance: new_balance,
        diffs: %{
          votesCast: merged_votes_cast,
          votesReceived: merged_votes_received
        }
      })
    )
    |> Multi.run(:update_balance, fn _repo, _changes ->
      user
      |> Ecto.Changeset.change(balance: user.balance + pixels_earned)
      |> Repo.update()
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{log: log, update_balance: updated_user}} ->
        {:ok, {log, updated_user}}

      {:error, _failed_operation, reason, _changes} ->
        {:error, reason}
    end
  end
end
