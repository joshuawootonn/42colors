defmodule ApiWeb.VoteController do
  use ApiWeb, :controller

  alias Api.Canvas.Vote

  action_fallback ApiWeb.FallbackController

  def create(conn, %{"plot_id" => plot_id}) do
    user = conn.assigns.current_user

    case Vote.Service.cast_vote(user.id, plot_id) do
      {:ok, vote} ->
        plot = Api.Canvas.Plot.Repo.get_plot!(plot_id)

        conn
        |> put_status(:created)
        |> json(%{
          vote: %{id: vote.id},
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

      {:error, :already_voted} ->
        conn
        |> put_status(:conflict)
        |> json(%{error_code: "ALREADY_VOTED", message: "You have already voted on this plot"})

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
    has_voted = Vote.Repo.has_user_voted_on_plot?(user.id, String.to_integer(plot_id))
    json(conn, %{has_voted: has_voted})
  end
end
