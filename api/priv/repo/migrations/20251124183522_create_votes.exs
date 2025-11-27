defmodule Api.Repo.Migrations.CreateVotes do
  use Ecto.Migration

  def change do
    create table(:votes) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :plot_id, references(:plots, on_delete: :delete_all), null: false
      add :vote_type, :string, null: false
      add :amount, :integer, null: false
      add :settled_at, :utc_datetime
      add :settlement_date, :date

      timestamps(type: :utc_datetime)
    end

    # Constraints
    create constraint(:votes, :valid_vote_type, check: "vote_type IN ('upvote', 'downvote')")
    create constraint(:votes, :positive_amount, check: "amount > 0")

    # Indexes
    create index(:votes, [:user_id, :plot_id])
    create index(:votes, [:plot_id])
    create index(:votes, [:settled_at])
    create index(:votes, [:user_id, :settled_at])
    create index(:votes, [:settlement_date])
  end
end
