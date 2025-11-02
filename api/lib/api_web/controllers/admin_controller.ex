defmodule ApiWeb.AdminController do
  use ApiWeb, :controller

  alias Api.Accounts
  alias Api.Logs.Log.Service, as: LogService
  alias Api.Repo

  @admin_email "jose56wonton@gmail.com"

  def search_users(conn, %{"query" => query}) when is_binary(query) do
    current_user = conn.assigns.current_user

    unless current_user.email == @admin_email do
      conn
      |> put_status(:forbidden)
      |> json(%{
        status: "error",
        message: "Unauthorized"
      })
    else
      users =
        Accounts.search_users_by_email(query)
        |> Enum.map(fn user ->
          %{
            id: user.id,
            email: user.email,
            balance: user.balance
          }
        end)

      json(conn, %{
        status: "success",
        users: users
      })
    end
  end

  def search_users(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      status: "error",
      message: "Query parameter is required"
    })
  end

  def grant_pixels(conn, %{"user_id" => user_id, "amount" => amount}) do
    current_user = conn.assigns.current_user

    unless current_user.email == @admin_email do
      conn
      |> put_status(:forbidden)
      |> json(%{
        status: "error",
        message: "Unauthorized"
      })
    else
      try do
        target_user = Accounts.get_user!(user_id)
        grant_amount = String.to_integer(amount)

        if grant_amount <= 0 do
          conn
          |> put_status(:bad_request)
          |> json(%{
            status: "error",
            message: "Grant amount must be positive"
          })
        else
          current_user_balance = Repo.get!(Accounts.User, target_user.id).balance
          balance_change = LogService.calculate_balance_change(current_user_balance, grant_amount)

          case LogService.create_log(%{
                 user_id: target_user.id,
                 old_balance: balance_change.old_balance,
                 new_balance: balance_change.new_balance,
                 log_type: "fun_money_grant",
                 diffs: %{
                   "reason" => "Admin grant",
                   "grant_amount" => grant_amount,
                   "granted_by" => current_user.email,
                   "granted_at" => DateTime.utc_now() |> DateTime.to_iso8601()
                 }
               }) do
            {:ok, {_log, updated_user}} ->
              json(conn, %{
                status: "success",
                message: "Granted #{grant_amount} pixels to #{target_user.email}",
                user: %{
                  id: updated_user.id,
                  email: updated_user.email,
                  balance: updated_user.balance
                }
              })

            {:error, reason} ->
              conn
              |> put_status(:internal_server_error)
              |> json(%{
                status: "error",
                message: "Failed to grant pixels",
                reason: inspect(reason)
              })
          end
        end
      rescue
        Ecto.NoResultsError ->
          conn
          |> put_status(:not_found)
          |> json(%{
            status: "error",
            message: "User not found"
          })
      end
    end
  end

  def grant_pixels(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      status: "error",
      message: "user_id and amount are required"
    })
  end
end
