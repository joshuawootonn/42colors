defmodule Api.Canvas.Vote.Repo do
  @moduledoc """
  Repository functions for Vote operations.
  """

  import Ecto.Query, warn: false
  alias Api.Repo
  alias Api.Canvas.Vote
  alias Api.Canvas.Plot

  @doc """
  Gets all votes from a user on a specific plot.
  """
  def get_user_plot_votes(user_id, plot_id) do
    from(v in Vote,
      where: v.user_id == ^user_id and v.plot_id == ^plot_id,
      order_by: [desc: v.inserted_at]
    )
    |> Repo.all()
  end

  @doc """
  Gets all unsettled votes.
  """
  def get_unsettled_votes do
    from(v in Vote,
      where: is_nil(v.settled_at),
      preload: [:user, :plot]
    )
    |> Repo.all()
  end

  @doc """
  Gets unsettled votes for a specific date (based on inserted_at).
  """
  def get_unsettled_votes_for_date(date) do
    start_of_day = DateTime.new!(date, ~T[00:00:00])
    end_of_day = DateTime.new!(date, ~T[23:59:59])

    from(v in Vote,
      where: is_nil(v.settled_at),
      where: v.inserted_at >= ^start_of_day and v.inserted_at <= ^end_of_day,
      preload: [:user, :plot]
    )
    |> Repo.all()
  end

  @doc """
  Creates a vote.
  """
  def create_vote(attrs) do
    %Vote{}
    |> Vote.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Marks votes as settled.
  """
  def mark_votes_settled(vote_ids, settled_at, settlement_date) do
    from(v in Vote,
      where: v.id in ^vote_ids
    )
    |> Repo.update_all(set: [settled_at: settled_at, settlement_date: settlement_date])
  end

  @doc """
  Checks if a user has created at least one plot.
  """
  def has_user_created_plot?(user_id) do
    from(p in Plot,
      where: p.user_id == ^user_id,
      where: is_nil(p.deleted_at),
      limit: 1
    )
    |> Repo.exists?()
  end

  @doc """
  Checks if a user has voted on a specific plot.
  """
  def has_user_voted_on_plot?(user_id, plot_id) do
    from(v in Vote,
      where: v.user_id == ^user_id and v.plot_id == ^plot_id,
      limit: 1
    )
    |> Repo.exists?()
  end
end
