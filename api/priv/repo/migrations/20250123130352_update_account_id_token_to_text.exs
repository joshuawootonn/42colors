defmodule Api.Repo.Migrations.UpdateAccountIdTokenToText do
  use Ecto.Migration

  def change do
    execute "alter table accounts alter column id_token type text"
  end
end
