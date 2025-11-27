defmodule Api.Canvas.Vote.Service do
  @moduledoc """
  Service layer for vote operations with business logic.

  Handles:
  - Casting votes (immediate, no balance update, no log creation)
  - Daily settlement (batch processing with balance updates and log creation)
  """

  import Ecto.Query, warn: false
  alias Api.Repo
  alias Api.Canvas.Vote
  alias Api.Canvas.Plot
  alias Api.Accounts.UserBalance
  alias Api.Logs.Log.Service, as: LogService
  alias Ecto.Multi

  @max_vote_per_plot 100

  @doc """
  Cast a vote on a plot.

  Validates eligibility, checks balance, creates vote record and updates plot score.
  Does NOT update user balance or create logs (those happen during daily settlement).

  ## Parameters

    * `user_id` - The user casting the vote
    * `plot_id` - The plot being voted on
    * `vote_type` - Either "upvote" or "downvote"
    * `amount` - Number of pixels to vote (must be > 0)

  ## Returns

    * `{:ok, vote}` - Vote was cast successfully
    * `{:error, reason}` - Vote failed due to validation error

  ## Error Reasons

    * `:vote_unauthorized` - User hasn't created any plots
    * `:plot_not_found` - Plot doesn't exist
    * `:vote_own_plot` - Can't vote on your own plot
    * `:vote_direction_locked` - Can't switch from upvote to downvote or vice versa
    * `:vote_amount_exceeded` - Total votes would exceed 100 pixels
    * `:vote_insufficient_balance` - Not enough available balance

  """
  def cast_vote(user_id, plot_id, vote_type, amount) do
    with {:ok, :eligible} <- check_eligibility(user_id),
         {:ok, plot} <- get_plot(plot_id),
         {:ok, :not_own_plot} <- check_not_own_plot(user_id, plot),
         {:ok, :direction_ok} <- check_vote_direction(user_id, plot_id, vote_type),
         {:ok, :amount_ok} <- check_total_amount(user_id, plot_id, amount),
         {:ok, :balance_ok} <- check_available_balance(user_id, amount) do
      create_vote_and_update_score(user_id, plot_id, vote_type, amount)
    end
  end

  @doc """
  Settle daily votes for all users.

  This is called by the Quantum scheduler at midnight UTC.
  Processes all unsettled votes, creates logs, updates balances, and marks votes as settled.
  """
  def settle_daily_votes do
    # Get all unsettled votes
    votes = Vote.Repo.get_unsettled_votes()

    if Enum.empty?(votes) do
      {:ok, :no_votes_to_settle}
    else
      # Group by user_id (voters)
      votes_by_voter = Enum.group_by(votes, & &1.user_id)

      # Also find plot owners who received votes
      plot_ids = Enum.map(votes, & &1.plot_id) |> Enum.uniq()
      plots = from(p in Plot, where: p.id in ^plot_ids) |> Repo.all()
      plot_owner_ids = Enum.map(plots, & &1.user_id) |> Enum.uniq()

      # Get all affected user IDs (voters + receivers)
      all_user_ids = (Map.keys(votes_by_voter) ++ plot_owner_ids) |> Enum.uniq()

      # Process each user
      results =
        Enum.map(all_user_ids, fn user_id ->
          user_cast_votes = Map.get(votes_by_voter, user_id, [])
          settle_user_votes(user_id, user_cast_votes, votes)
        end)

      # Check for any failures
      failures =
        Enum.filter(results, fn
          {:ok, _} -> false
          {:error, _} -> true
        end)

      if Enum.empty?(failures) do
        {:ok, %{processed_users: length(all_user_ids), total_votes: length(votes)}}
      else
        {:error, %{failures: failures, processed_users: length(all_user_ids)}}
      end
    end
  end

  @doc """
  Settle votes for a specific date.

  Useful for manual settlement if the scheduled job failed.
  """
  def settle_votes_for_date(date) do
    votes = Vote.Repo.get_unsettled_votes_for_date(date)

    if Enum.empty?(votes) do
      {:ok, :no_votes_to_settle}
    else
      votes_by_voter = Enum.group_by(votes, & &1.user_id)

      # Also find plot owners who received votes
      plot_ids = Enum.map(votes, & &1.plot_id) |> Enum.uniq()
      plots = from(p in Plot, where: p.id in ^plot_ids) |> Repo.all()
      plot_owner_ids = Enum.map(plots, & &1.user_id) |> Enum.uniq()

      # Get all affected user IDs
      all_user_ids = (Map.keys(votes_by_voter) ++ plot_owner_ids) |> Enum.uniq()

      results =
        Enum.map(all_user_ids, fn user_id ->
          user_cast_votes = Map.get(votes_by_voter, user_id, [])
          settle_user_votes(user_id, user_cast_votes, votes, date)
        end)

      failures =
        Enum.filter(results, fn
          {:ok, _} -> false
          {:error, _} -> true
        end)

      if Enum.empty?(failures) do
        {:ok, %{processed_users: length(all_user_ids), total_votes: length(votes)}}
      else
        {:error, %{failures: failures, processed_users: length(all_user_ids)}}
      end
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

  defp check_vote_direction(user_id, plot_id, vote_type) do
    existing_type = Vote.Repo.get_user_plot_vote_type(user_id, plot_id)

    case existing_type do
      nil -> {:ok, :direction_ok}
      ^vote_type -> {:ok, :direction_ok}
      _ -> {:error, :vote_direction_locked}
    end
  end

  defp check_total_amount(user_id, plot_id, amount) do
    existing_total = Vote.Repo.get_user_plot_vote_total(user_id, plot_id)
    new_total = existing_total + amount

    if new_total <= @max_vote_per_plot do
      {:ok, :amount_ok}
    else
      {:error, :vote_amount_exceeded}
    end
  end

  defp check_available_balance(user_id, amount) do
    available_balance = UserBalance.get_available_balance(user_id)

    if available_balance >= amount do
      {:ok, :balance_ok}
    else
      {:error, :vote_insufficient_balance}
    end
  end

  defp create_vote_and_update_score(user_id, plot_id, vote_type, amount) do
    Multi.new()
    |> Multi.insert(:vote, fn _changes ->
      Vote.changeset(%Vote{}, %{
        user_id: user_id,
        plot_id: plot_id,
        vote_type: vote_type,
        amount: amount,
        settled_at: nil
      })
    end)
    |> Multi.run(:update_plot_score, fn _repo, %{vote: vote} ->
      plot = Repo.get!(Plot, vote.plot_id)
      score_change = if vote_type == "upvote", do: amount, else: -amount
      new_score = plot.score + score_change

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

  defp settle_user_votes(user_id, user_cast_votes, all_unsettled_votes, settlement_date \\ nil) do
    settlement_date = settlement_date || Date.utc_today()
    settled_at = DateTime.utc_now()

    # Calculate cast side (votes this user cast)
    {cast_diffs, total_cast} = calculate_cast_diffs(user_cast_votes)

    # Calculate receive side (votes received on this user's plots from ALL votes)
    {received_diffs, total_received} = calculate_received_diffs(user_id, all_unsettled_votes)

    # Calculate balance change
    user = Repo.get!(Api.Accounts.User, user_id)
    old_balance = user.balance
    new_balance = old_balance - total_cast + total_received

    # Skip if no activity (shouldn't happen, but be safe)
    if Enum.empty?(cast_diffs) and Enum.empty?(received_diffs) do
      {:ok, :no_activity}
    else
      # Create log and update balance in transaction
      Multi.new()
      |> Multi.run(:log, fn _repo, _changes ->
        LogService.create_log(%{
          user_id: user_id,
          old_balance: old_balance,
          new_balance: new_balance,
          log_type: "daily_vote_aggregate",
          diffs: %{
            cast_diffs: cast_diffs,
            received_diffs: received_diffs
          }
        })
      end)
      |> Multi.run(:mark_settled, fn _repo, _changes ->
        # Only mark the votes this user cast as settled
        if Enum.empty?(user_cast_votes) do
          {:ok, :no_votes_to_mark}
        else
          vote_ids = Enum.map(user_cast_votes, & &1.id)
          Vote.Repo.mark_votes_settled(vote_ids, settled_at, settlement_date)
          {:ok, :marked}
        end
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{log: {_log, _user}, mark_settled: _}} ->
          {:ok, user_id}

        {:error, failed_operation, reason, _changes} ->
          {:error, {user_id, failed_operation, reason}}
      end
    end
  end

  defp calculate_cast_diffs(cast_votes) do
    # Group by plot_id and calculate score changes
    votes_by_plot = Enum.group_by(cast_votes, & &1.plot_id)

    diffs =
      Enum.map(votes_by_plot, fn {plot_id, votes} ->
        plot = Repo.get!(Plot, plot_id)
        _total_amount = Enum.reduce(votes, 0, fn v, acc -> acc + v.amount end)

        # Calculate old score (subtract the votes from current score)
        # Upvotes added to score, downvotes subtracted
        score_change =
          Enum.reduce(votes, 0, fn v, acc ->
            if v.vote_type == "upvote", do: acc + v.amount, else: acc - v.amount
          end)

        old_score = plot.score - score_change

        %{
          name: plot.name,
          old_score: old_score,
          new_score: plot.score
        }
      end)

    total_cast = Enum.reduce(cast_votes, 0, fn v, acc -> acc + v.amount end)

    {diffs, total_cast}
  end

  defp calculate_received_diffs(user_id, all_unsettled_votes) do
    # Find this user's plots
    user_plots =
      from(p in Plot,
        where: p.user_id == ^user_id and is_nil(p.deleted_at)
      )
      |> Repo.all()

    user_plot_ids = Enum.map(user_plots, & &1.id)

    # Filter votes that are on this user's plots from all unsettled votes
    received_votes =
      Enum.filter(all_unsettled_votes, fn v ->
        v.plot_id in user_plot_ids
      end)

    if Enum.empty?(received_votes) do
      {[], 0}
    else
      # Group by plot_id
      votes_by_plot = Enum.group_by(received_votes, & &1.plot_id)

      diffs =
        Enum.map(votes_by_plot, fn {plot_id, votes} ->
          plot = Repo.get!(Plot, plot_id)

          # Calculate old score
          score_change =
            Enum.reduce(votes, 0, fn v, acc ->
              if v.vote_type == "upvote", do: acc + v.amount, else: acc - v.amount
            end)

          old_score = plot.score - score_change

          %{
            name: plot.name,
            old_score: old_score,
            new_score: plot.score
          }
        end)

      # Total received is only upvotes (downvotes don't transfer pixels)
      total_received =
        received_votes
        |> Enum.filter(&(&1.vote_type == "upvote"))
        |> Enum.reduce(0, fn v, acc -> acc + v.amount end)

      {diffs, total_received}
    end
  end
end
