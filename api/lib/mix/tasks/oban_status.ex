defmodule Mix.Tasks.ObanStatus do
  @moduledoc """
  Display Oban job status and history.

  ## Usage

      mix oban_status              # Show recent jobs (last 20)
      mix oban_status --all        # Show all jobs
      mix oban_status --failed     # Show only failed/discarded jobs
      mix oban_status --scheduled  # Show scheduled cron jobs
  """
  use Mix.Task

  import Ecto.Query

  @shortdoc "Display Oban job status"

  @impl Mix.Task
  def run(args) do
    Mix.Task.run("app.start")

    cond do
      "--scheduled" in args -> show_scheduled_jobs()
      "--failed" in args -> show_failed_jobs()
      "--all" in args -> show_jobs(nil)
      true -> show_jobs(20)
    end
  end

  defp show_jobs(limit) do
    query =
      from(j in Oban.Job,
        where: j.worker == "Api.Workers.VoteSettlementWorker",
        order_by: [desc: j.inserted_at]
      )

    query = if limit, do: limit(query, ^limit), else: query

    jobs = Api.Repo.all(query)

    if Enum.empty?(jobs) do
      Mix.shell().info("No VoteSettlementWorker jobs found.")
    else
      Mix.shell().info("\n#{IO.ANSI.bright()}Vote Settlement Jobs#{IO.ANSI.reset()}\n")

      Enum.each(jobs, fn job ->
        state_color = state_color(job.state)
        scheduled = Calendar.strftime(job.scheduled_at, "%Y-%m-%d %H:%M:%S UTC")

        completed =
          if job.completed_at,
            do: Calendar.strftime(job.completed_at, "%Y-%m-%d %H:%M:%S UTC"),
            else: "-"

        Mix.shell().info("""
        #{state_color}[#{job.state}]#{IO.ANSI.reset()} ID: #{job.id}
          Scheduled: #{scheduled}
          Completed: #{completed}
          Attempts:  #{job.attempt}/#{job.max_attempts}
          Args:      #{inspect(job.args)}
          #{if job.errors != [], do: "Errors:    #{inspect(job.errors)}", else: ""}
        """)
      end)
    end
  end

  defp show_failed_jobs do
    jobs =
      from(j in Oban.Job,
        where: j.worker == "Api.Workers.VoteSettlementWorker",
        where: j.state in ["discarded", "retryable", "cancelled"],
        order_by: [desc: j.inserted_at]
      )
      |> Api.Repo.all()

    if Enum.empty?(jobs) do
      Mix.shell().info("#{IO.ANSI.green()}No failed jobs found!#{IO.ANSI.reset()}")
    else
      Mix.shell().info("\n#{IO.ANSI.red()}Failed Vote Settlement Jobs#{IO.ANSI.reset()}\n")

      Enum.each(jobs, fn job ->
        Mix.shell().info("""
        [#{job.state}] ID: #{job.id}
          Scheduled: #{Calendar.strftime(job.scheduled_at, "%Y-%m-%d %H:%M:%S UTC")}
          Attempts:  #{job.attempt}/#{job.max_attempts}
          Args:      #{inspect(job.args)}
          Errors:    #{format_errors(job.errors)}
        """)
      end)
    end
  end

  defp show_scheduled_jobs do
    # Get upcoming scheduled jobs
    now = DateTime.utc_now()

    jobs =
      from(j in Oban.Job,
        where: j.worker == "Api.Workers.VoteSettlementWorker",
        where: j.state in ["scheduled", "available"],
        where: j.scheduled_at >= ^now,
        order_by: [asc: j.scheduled_at],
        limit: 10
      )
      |> Api.Repo.all()

    Mix.shell().info("\n#{IO.ANSI.bright()}Upcoming Scheduled Jobs#{IO.ANSI.reset()}\n")

    if Enum.empty?(jobs) do
      Mix.shell().info(
        "No upcoming jobs scheduled. The cron plugin will insert the next job within 5 minutes."
      )
    else
      Enum.each(jobs, fn job ->
        Mix.shell().info("""
        [#{job.state}] ID: #{job.id}
          Scheduled for: #{Calendar.strftime(job.scheduled_at, "%Y-%m-%d %H:%M:%S UTC")}
          Args: #{inspect(job.args)}
        """)
      end)
    end

    # Show cron config
    Mix.shell().info("\n#{IO.ANSI.bright()}Cron Configuration#{IO.ANSI.reset()}")
    Mix.shell().info("  VoteSettlementWorker: */5 * * * * (every 5 minutes)\n")
  end

  defp state_color("completed"), do: IO.ANSI.green()
  defp state_color("available"), do: IO.ANSI.cyan()
  defp state_color("scheduled"), do: IO.ANSI.blue()
  defp state_color("executing"), do: IO.ANSI.yellow()
  defp state_color("retryable"), do: IO.ANSI.magenta()
  defp state_color("discarded"), do: IO.ANSI.red()
  defp state_color("cancelled"), do: IO.ANSI.red()
  defp state_color(_), do: IO.ANSI.reset()

  defp format_errors([]), do: "none"

  defp format_errors(errors) do
    errors
    |> Enum.map(fn error ->
      "\n          - #{error["at"]}: #{String.slice(error["error"] || "", 0..200)}"
    end)
    |> Enum.join()
  end
end
