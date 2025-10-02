defmodule Api.Repo.Migrations.ChangeInitialBalanceValue do
  use Ecto.Migration

  def change do
    # Change the default value of the balance column from 500 to 2000
    alter table(:users) do
      modify :balance, :integer, default: 2000, null: false
    end
  end
end
