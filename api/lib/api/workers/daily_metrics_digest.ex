defmodule Api.Workers.DailyMetricsDigest do
  @moduledoc """
  Sends a daily metrics digest to Discord with key application stats.
  Runs at 9 AM UTC every day.
  """
  use Oban.Worker,
    queue: :default,
    max_attempts: 3

  require Logger

  @discord_webhook_env "DISCORD_ALERT_WEBHOOK"

  @impl Oban.Worker
  def perform(_job) do
    case System.get_env(@discord_webhook_env) do
      nil ->
        Logger.warning("Discord webhook not configured, skipping daily digest")
        :ok

      webhook_url ->
        send_digest(webhook_url)
    end
  end

  defp send_digest(webhook_url) do
    metrics = gather_metrics()
    message = format_discord_message(metrics)

    case post_to_discord(webhook_url, message) do
      {:ok, _} ->
        Logger.info("Daily metrics digest sent to Discord")
        :ok

      {:error, reason} ->
        Logger.error("Failed to send daily digest: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp gather_metrics do
    now = DateTime.utc_now()
    yesterday = DateTime.add(now, -24, :hour)

    %{
      date: Calendar.strftime(yesterday, "%B %d, %Y"),
      app: gather_app_metrics(),
      database: gather_database_metrics(),
      system: gather_system_metrics(),
      oban: gather_oban_metrics(),
      redis: gather_redis_metrics()
    }
  end

  defp gather_app_metrics do
    # Get metrics from PromEx/telemetry
    %{
      # These will be populated from actual metrics when available
      total_requests: get_counter_value("api_prom_ex_phoenix_http_requests_total", 0),
      error_count: get_counter_value("api_prom_ex_phoenix_http_request_failures_total", 0),
      avg_latency_ms: get_gauge_value("api_prom_ex_phoenix_http_request_duration_milliseconds", 0)
    }
  end

  defp gather_database_metrics do
    %{
      total_queries: get_counter_value("api_prom_ex_ecto_repo_query_total_count", 0),
      avg_query_time_ms: get_gauge_value("api_prom_ex_ecto_repo_query_total_time_milliseconds", 0)
    }
  end

  defp gather_system_metrics do
    # Get current BEAM metrics
    memory = :erlang.memory()

    %{
      memory_mb: Float.round(memory[:total] / 1_048_576, 1),
      process_count: :erlang.system_info(:process_count),
      uptime_hours:
        Float.round(:erlang.statistics(:wall_clock) |> elem(0) |> Kernel./(3_600_000), 1)
    }
  end

  defp gather_oban_metrics do
    # Query Oban for job stats from the last 24 hours
    import Ecto.Query

    yesterday = DateTime.add(DateTime.utc_now(), -24, :hour)

    completed =
      Api.Repo.one(
        from(j in Oban.Job,
          where: j.state == "completed" and j.completed_at >= ^yesterday,
          select: count(j.id)
        )
      ) || 0

    failed =
      Api.Repo.one(
        from(j in Oban.Job,
          where: j.state in ["discarded", "cancelled"] and j.completed_at >= ^yesterday,
          select: count(j.id)
        )
      ) || 0

    %{
      completed_jobs: completed,
      failed_jobs: failed
    }
  end

  defp gather_redis_metrics do
    # Check Redis connectivity via the PixelCache
    try do
      # Simple check - if chunk_exists? returns without error, Redis is connected
      _ = Api.PixelCache.Redis.chunk_exists?(0, 0)
      %{connected: true}
    rescue
      _ -> %{connected: false}
    catch
      :exit, _ -> %{connected: false}
    end
  end

  defp get_counter_value(_metric_name, default) do
    # In a full implementation, you'd query Prometheus here
    # For now, return default as these metrics are primarily for Prometheus/Grafana
    default
  end

  defp get_gauge_value(_metric_name, default) do
    default
  end

  defp format_discord_message(metrics) do
    %{
      embeds: [
        %{
          title: "📊 Daily Metrics Digest",
          description: "Summary for #{metrics.date}",
          color: 0x5865F2,
          fields: [
            %{
              name: "🌐 Application",
              value: """
              Requests: **#{metrics.app.total_requests}**
              Errors: **#{metrics.app.error_count}**
              Avg Latency: **#{metrics.app.avg_latency_ms}ms**
              """,
              inline: true
            },
            %{
              name: "🗄️ Database",
              value: """
              Queries: **#{metrics.database.total_queries}**
              Avg Query Time: **#{metrics.database.avg_query_time_ms}ms**
              """,
              inline: true
            },
            %{
              name: "⚙️ System",
              value: """
              Memory: **#{metrics.system.memory_mb} MB**
              Processes: **#{metrics.system.process_count}**
              Uptime: **#{metrics.system.uptime_hours}h**
              """,
              inline: true
            },
            %{
              name: "📋 Background Jobs",
              value: """
              Completed: **#{metrics.oban.completed_jobs}**
              Failed: **#{metrics.oban.failed_jobs}**
              """,
              inline: true
            },
            %{
              name: "🔴 Redis",
              value: """
              Status: **#{if metrics.redis.connected, do: "Connected ✅", else: "Disconnected ❌"}**
              """,
              inline: true
            }
          ],
          footer: %{
            text: "42colors.com"
          },
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ]
    }
  end

  defp post_to_discord(webhook_url, message) do
    body = Jason.encode!(message)

    Finch.build(:post, webhook_url, [{"content-type", "application/json"}], body)
    |> Finch.request(Api.Finch)
  end
end
