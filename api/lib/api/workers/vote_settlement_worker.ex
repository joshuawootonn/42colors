defmodule Api.Workers.VoteSettlementWorker do
  @moduledoc """
  Oban worker for daily vote settlement.

  Runs at midnight UTC to aggregate votes from the previous day,
  update user balances, and create settlement logs.

  This replaces the previous Quantum scheduler job and provides:
  - Job persistence and retry logic
  - Observable job history in the database
  - Manual triggering via Oban.insert/1
  """
  use Oban.Worker, queue: :default, max_attempts: 3

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    date =
      case Map.get(args, "date") do
        nil -> Date.utc_today() |> Date.add(-1)
        date_string -> Date.from_iso8601!(date_string)
      end

    Logger.info("Starting vote settlement for #{date}")

    case Api.Canvas.Vote.Service.settle_daily_votes(date) do
      {:ok, :no_votes_to_settle} ->
        Logger.info("No votes to settle for #{date}")
        :ok

      {:ok, result} ->
        Logger.info(
          "Vote settlement completed for #{date}: #{result.processed_users} users, #{result.total_votes} votes"
        )

        :ok

      {:error, reason} ->
        Logger.error("Vote settlement failed for #{date}: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
