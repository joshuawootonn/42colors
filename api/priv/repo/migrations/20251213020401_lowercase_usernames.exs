defmodule Api.Repo.Migrations.LowercaseUsernames do
  use Ecto.Migration

  def up do
    execute("UPDATE users SET username = LOWER(username)")
  end

  def down do
    # No-op: we can't reliably restore the original casing
    :ok
  end
end
