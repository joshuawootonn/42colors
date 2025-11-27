defmodule ApiWeb.VoteController do
  use ApiWeb, :controller

  alias Api.Canvas.Vote

  action_fallback ApiWeb.FallbackController

  def create(conn, %{"plot_id" => plot_id, "vote_type" => vote_type, "amount" => amount}) do
    user = conn.assigns.current_user

    case Vote.Service.cast_vote(user.id, plot_id, vote_type, amount) do
      {:ok, vote} ->
        plot = Api.Canvas.Plot.Repo.get_plot!(plot_id)

        conn
        |> put_status(:created)
        |> json(%{
          vote: %{
            id: vote.id,
            vote_type: vote.vote_type,
            amount: vote.amount
          },
          plot_score: plot.score
        })

      {:error, :vote_unauthorized} ->
        conn
        |> put_status(:forbidden)
        |> json(%{
          error_code: "VOTE_UNAUTHORIZED",
          message: "You must create a plot before voting"
        })

      {:error, :vote_own_plot} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error_code: "VOTE_OWN_PLOT", message: "You cannot vote on your own plot"})

      {:error, :vote_direction_locked} ->
        conn
        |> put_status(:conflict)
        |> json(%{
          error_code: "VOTE_DIRECTION_LOCKED",
          message: "You cannot change your vote direction"
        })

      {:error, :vote_amount_exceeded} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error_code: "VOTE_AMOUNT_EXCEEDED", message: "Maximum 100 pixels per plot"})

      {:error, :vote_insufficient_balance} ->
        conn
        |> put_status(:payment_required)
        |> json(%{error_code: "VOTE_INSUFFICIENT_BALANCE", message: "Insufficient balance"})

      {:error, :plot_not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error_code: "PLOT_NOT_FOUND", message: "Plot not found"})

      {:error, _reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error_code: "VOTE_FAILED", message: "Failed to cast vote"})
    end
  end

  def show(conn, %{"plot_id" => plot_id}) do
    user = conn.assigns.current_user

    total = Vote.Repo.get_user_plot_vote_total(user.id, String.to_integer(plot_id))
    vote_type = Vote.Repo.get_user_plot_vote_type(user.id, String.to_integer(plot_id))

    json(conn, %{total: total, vote_type: vote_type})
  end
end
