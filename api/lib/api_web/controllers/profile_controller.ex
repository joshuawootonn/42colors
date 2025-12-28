defmodule ApiWeb.ProfileController do
  use ApiWeb, :controller

  alias Api.Accounts
  alias Api.Canvas.Plot

  action_fallback ApiWeb.FallbackController

  def show(conn, %{"id" => id}) do
    case parse_integer(id) do
      {:ok, user_id} ->
        case Accounts.get_user(user_id) do
          nil ->
            conn
            |> put_status(:not_found)
            |> json(%{error: "User not found"})

          user ->
            render(conn, :show, user: user)
        end

      {:error, :invalid_integer} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid user ID"})
    end
  end

  def show_plots(conn, %{"id" => id}) do
    case parse_integer(id) do
      {:ok, user_id} ->
        case Accounts.get_user(user_id) do
          nil ->
            conn
            |> put_status(:not_found)
            |> json(%{error: "User not found"})

          _user ->
            plots = Plot.Repo.list_user_plots(user_id)
            render(conn, :show_plots, plots: plots)
        end

      {:error, :invalid_integer} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid user ID"})
    end
  end

  defp parse_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, :invalid_integer}
    end
  end

  defp parse_integer(_), do: {:error, :invalid_integer}
end
