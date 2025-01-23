defmodule Api.Repo.Migrations.DropOldUserTokenAndNotifier do
  use Ecto.Migration

  def change do
    drop table("users_tokens")
  end
end
