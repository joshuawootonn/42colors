defmodule Mix.Tasks.SettleVotes do
  @moduledoc """
  Manually run vote aggregation/settlement for a specific date.

  This task settles votes created on the specified date (or today if not specified),
  marks them as settled, and creates/updates daily_vote_aggregate log entries.

  If run multiple times for the same date, it will update existing logs
  rather than creating duplicates.

  ## Usage

      # Settle today's votes
      mix settle_votes

      # Settle votes for a specific date
      mix settle_votes 2025-12-07

  ## Examples

      # Run in dev environment
      export $(xargs <.env.dev) && mix settle_votes

      # Settle a specific date in dev
      export $(xargs <.env.dev) && mix settle_votes 2025-12-07

      # Run in test environment
      export $(xargs <.env.test) && mix settle_votes
  """

  use Mix.Task

  @shortdoc "Settle votes for a specific date and create/update log entries"

  @impl Mix.Task
  def run(args) do
    # Start the application
    Mix.Task.run("app.start")

    date = parse_date(args)

    IO.puts("Starting vote settlement for #{date}...")

    case Api.Canvas.Vote.Service.settle_daily_votes(date) do
      {:ok, :no_votes_to_settle} ->
        IO.puts("No votes found for #{date}.")

      {:ok, %{processed_users: users, total_votes: votes, date: settled_date}} ->
        IO.puts("✓ Settlement complete for #{settled_date}!")
        IO.puts("  - Processed #{users} users")
        IO.puts("  - Settled #{votes} votes")

      {:error, %{failures: failures, processed_users: users}} ->
        IO.puts("⚠ Settlement completed with errors")
        IO.puts("  - Processed #{users} users")
        IO.puts("  - Failures: #{length(failures)}")

        Enum.each(failures, fn {:error, reason} ->
          IO.puts("    - #{inspect(reason)}")
        end)

      {:error, reason} ->
        IO.puts("✗ Settlement failed: #{inspect(reason)}")
    end
  end

  defp parse_date([]), do: Date.utc_today()

  defp parse_date([date_string | _]) do
    case Date.from_iso8601(date_string) do
      {:ok, date} ->
        date

      {:error, _} ->
        IO.puts("Invalid date format: #{date_string}")
        IO.puts("Expected format: YYYY-MM-DD (e.g., 2025-12-07)")
        System.halt(1)
    end
  end
end
