defmodule Api.Repo.Migrations.SimplifyVotesAndAddLogMetadata do
  use Ecto.Migration

  def change do
    # Simplify votes table: remove vote_type and amount, add old_score
    alter table(:votes) do
      remove :vote_type, :string
      remove :amount, :integer
      add :old_score, :integer
    end

    # Create unique index to enforce one vote per user per plot
    create unique_index(:votes, [:user_id, :plot_id], name: :votes_user_id_plot_id_unique_index)

    # Add metadata column to logs for storing settled_at and other metadata
    alter table(:logs) do
      add :metadata, :map
    end
  end
end
