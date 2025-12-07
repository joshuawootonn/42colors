defmodule Api.Repo.Migrations.RemoveVoteTypeAndAmountFromVotes do
  use Ecto.Migration

  def change do
    alter table(:votes) do
      remove :vote_type, :string
      remove :amount, :integer
    end

    # Each user can only vote once per plot
    create_if_not_exists unique_index(:votes, [:user_id, :plot_id])
  end
end
