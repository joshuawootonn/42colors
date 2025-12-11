defmodule Api.Repo.Migrations.RenameDailyVoteAggregateToVoteAggregate do
  use Ecto.Migration

  def up do
    execute "UPDATE logs SET log_type = 'vote_aggregate' WHERE log_type = 'daily_vote_aggregate'"
  end

  def down do
    execute "UPDATE logs SET log_type = 'daily_vote_aggregate' WHERE log_type = 'vote_aggregate'"
  end
end
