defmodule Api.Logs.Log do
  use Ecto.Schema
  import Ecto.Changeset

  @log_types ~w(initial_grant bailout_grant daily_visit_grant fun_money_grant plot_created plot_updated plot_deleted daily_vote_aggregate)

  schema "logs" do
    field :old_balance, :integer
    field :new_balance, :integer
    field :log_type, :string
    field :diffs, :map
    field :metadata, :map

    belongs_to :user, Api.Accounts.User
    belongs_to :plot, Api.Canvas.Plot

    timestamps(type: :utc_datetime)
  end

  def changeset(log, attrs) do
    log
    |> cast(attrs, [:user_id, :old_balance, :new_balance, :log_type, :plot_id, :diffs, :metadata])
    |> validate_required([:user_id, :old_balance, :new_balance, :log_type])
    |> validate_inclusion(:log_type, @log_types)
    |> validate_balance_change()
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:plot_id)
  end

  # Custom validation that allows zero balance changes for plot_updated logs
  defp validate_balance_change(changeset) do
    log_type = get_field(changeset, :log_type)
    old_balance = get_field(changeset, :old_balance)
    new_balance = get_field(changeset, :new_balance)

    case {log_type, old_balance, new_balance} do
      {"plot_updated", old_bal, new_bal} when old_bal == new_bal ->
        # Allow zero balance changes for plot updates (metadata-only changes)
        changeset

      {"daily_vote_aggregate", old_bal, new_bal} when old_bal == new_bal ->
        # Allow zero balance changes for vote aggregates (e.g., only received downvotes)
        changeset

      {"daily_visit_grant", _old_bal, _new_bal} ->
        # Daily visit grant should always increase balance
        if new_balance > old_balance do
          changeset
        else
          add_error(changeset, :new_balance, "Daily visit grant must increase balance")
        end

      {"fun_money_grant", _old_bal, _new_bal} ->
        # Fun money grant should always increase balance
        if new_balance > old_balance do
          changeset
        else
          add_error(changeset, :new_balance, "Fun money grant must increase balance")
        end

      {_log_type, old_bal, new_bal} when old_bal == new_bal ->
        # Disallow zero balance changes for other log types
        add_error(changeset, :new_balance, "Balance must change for this log type")

      _ ->
        # Balance changes are valid
        changeset
    end
  end

  def log_types, do: @log_types
end
