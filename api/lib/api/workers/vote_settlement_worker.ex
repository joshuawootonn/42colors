defmodule Api.Workers.VoteSettlementWorker do
  @moduledoc """
  Oban worker for vote settlement.

  Settles all unsettled votes, updating user balances and creating/updating
  vote_aggregate log entries.

  This replaces the previous Quantum scheduler job and provides:
  - Job persistence and retry logic
  - Observable job history in the database
  - Manual triggering via Oban.insert/1
  """
  use Oban.Worker, queue: :default, max_attempts: 3

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("Starting vote settlement")

    case Api.Canvas.Vote.Service.settle_votes() do
      {:ok, :no_votes_to_settle} ->
        Logger.info("No votes to settle")
        :ok

      {:ok, result} ->
        Logger.info(
          "Vote settlement completed: #{result.processed_users} users, #{result.total_votes} votes"
        )

        :ok

      {:error, reason} ->
        Logger.error("Vote settlement failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
