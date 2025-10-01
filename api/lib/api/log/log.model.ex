defmodule Api.Logs.Log do
  use Ecto.Schema
  import Ecto.Changeset

  @log_types ~w(initial_grant plot_created plot_updated plot_deleted)

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
    |> validate_amount_not_zero()
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:plot_id)
  end

  # Custom validation that allows zero amounts for plot_updated logs
  defp validate_amount_not_zero(changeset) do
    log_type = get_field(changeset, :log_type)
    amount = get_field(changeset, :amount)

    case {log_type, amount} do
      {"plot_updated", 0} ->
        # Allow zero amounts for plot updates (metadata-only changes)
        changeset

      {_log_type, 0} ->
        # Disallow zero amounts for other log types
        add_error(changeset, :amount, "Amount cannot be zero")

      _ ->
        # Non-zero amounts are always valid
        changeset
    end
  end

  def log_types, do: @log_types
end
