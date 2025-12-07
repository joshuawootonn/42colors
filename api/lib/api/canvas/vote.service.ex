defmodule Api.Canvas.Vote.Service do
  @moduledoc """
  Service layer for vote operations.

  Simplified voting: one upvote per user per plot, free to cast.
  """

  import Ecto.Query, warn: false
  alias Api.Repo
  alias Api.Canvas.Vote
  alias Api.Canvas.Plot
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
    |> Multi.insert(:vote, fn _changes ->
      Vote.changeset(%Vote{}, %{
        user_id: user_id,
        plot_id: plot_id
      })
    end)
    |> Multi.run(:update_plot_score, fn _repo, %{vote: vote} ->
      plot = Repo.get!(Plot, vote.plot_id)
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
end
