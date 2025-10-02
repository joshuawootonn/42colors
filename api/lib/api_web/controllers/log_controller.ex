defmodule ApiWeb.LogController do
  use ApiWeb, :controller

  alias Api.Logs.Log

  action_fallback ApiWeb.FallbackController

  def me_logs(conn, params) do
    user = conn.assigns.current_user

    limit_param = Map.get(params, "limit", "20")

    list_opts =
      case parse_limit(limit_param) do
        {:ok, limit} -> [limit: limit, preload: [:plot]]
        {:error, _} -> [limit: 20, preload: [:plot]]
      end

    logs = Log.Repo.list_by_user(user.id, list_opts)
    render(conn, :index, logs: logs)
  end

  defp parse_limit(limit_str) when is_binary(limit_str) do
    case Integer.parse(limit_str) do
      {limit, ""} when limit >= 0 and limit <= 100 -> {:ok, limit}
      _ -> {:error, :invalid_limit}
    end
  end

  defp parse_limit(_), do: {:error, :invalid_limit}
end
