defmodule Mix.Tasks.SettleVotes do
  @moduledoc """
  Manually run vote settlement.

  This task settles all unsettled votes, marks them as settled, and
  creates/updates vote_aggregate log entries.

  If the user's last log is a vote_aggregate from the same day, new votes
  are appended to that log. Otherwise, a new vote_aggregate log is created.

  ## Usage

      mix settle_votes

  ## Examples

      # Run in dev environment
      export $(xargs <.env.dev) && mix settle_votes

      # Run in test environment
      export $(xargs <.env.test) && mix settle_votes
  """

  use Mix.Task

  @shortdoc "Settle all unsettled votes and create/update log entries"

  @impl Mix.Task
  def run(_args) do
    # Start the application
    Mix.Task.run("app.start")

    IO.puts("Starting vote settlement...")

    case Api.Canvas.Vote.Service.settle_votes() do
      {:ok, :no_votes_to_settle} ->
        IO.puts("No unsettled votes found.")

      {:ok, %{processed_users: users, total_votes: votes}} ->
        IO.puts("✓ Settlement complete!")
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
end
