defmodule Api.Repo.Migrations.ChangeUserDefaultBalanceToZero do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :balance, :integer, default: 0, null: false
    end
  end
end
