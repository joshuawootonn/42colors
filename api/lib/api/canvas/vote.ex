defmodule Api.Canvas.Vote do
  use Ecto.Schema
  import Ecto.Changeset

  schema "votes" do
    field :settled_at, :utc_datetime
    field :settlement_date, :date
    belongs_to :user, Api.Accounts.User
    belongs_to :plot, Api.Canvas.Plot

    timestamps(type: :utc_datetime)
  end

  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:user_id, :plot_id, :settled_at, :settlement_date])
    |> validate_required([:user_id, :plot_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:plot_id)
    |> unique_constraint([:user_id, :plot_id], name: :votes_user_id_plot_id_index)
  end
end
