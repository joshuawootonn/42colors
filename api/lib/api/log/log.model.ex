defmodule Api.Logs.Log do
  use Ecto.Schema
  import Ecto.Changeset

  @log_types ~w(initial_grant plot_claimed plot_deleted)

  schema "logs" do
    field :amount, :integer
    field :log_type, :string
    field :metadata, :map

    belongs_to :user, Api.Accounts.User
    belongs_to :plot, Api.Canvas.Plot

    timestamps(type: :utc_datetime)
  end

  def changeset(log, attrs) do
    log
    |> cast(attrs, [:user_id, :amount, :log_type, :plot_id, :metadata])
    |> validate_required([:user_id, :amount, :log_type])
    |> validate_inclusion(:log_type, @log_types)
    |> validate_number(:amount, not_equal_to: 0, message: "Amount cannot be zero")
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:plot_id)
  end

  def log_types, do: @log_types
end
