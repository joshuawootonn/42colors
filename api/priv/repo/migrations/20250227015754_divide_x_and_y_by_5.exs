defmodule Api.Repo.Migrations.DivideXAndYBy5 do
  use Ecto.Migration

  def change do
    execute "update pixels set x = x / 5"
    execute "update pixels set y = y / 5"
  end
end
