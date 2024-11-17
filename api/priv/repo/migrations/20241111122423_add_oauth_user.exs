defmodule Api.Repo.Migrations.AddOauthUser do
  use Ecto.Migration
  alias Ecto.Migration

  def change do
    execute "alter table users alter column hashed_password drop not null"
    execute "alter table users add column is_oauth_user boolean default false"
  end
end
