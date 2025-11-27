defmodule Api.Canvas.Vote do
  use Ecto.Schema
  import Ecto.Changeset

  @vote_types ~w(upvote downvote)

  schema "votes" do
    field :vote_type, :string
    field :amount, :integer
    field :settled_at, :utc_datetime
    field :settlement_date, :date
    belongs_to :user, Api.Accounts.User
    belongs_to :plot, Api.Canvas.Plot

    timestamps(type: :utc_datetime)
  end

  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:user_id, :plot_id, :vote_type, :amount, :settled_at, :settlement_date])
    |> validate_required([:user_id, :plot_id, :vote_type, :amount])
    |> validate_inclusion(:vote_type, @vote_types)
    |> validate_number(:amount, greater_than: 0)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:plot_id)
  end

  def vote_types, do: @vote_types
end
