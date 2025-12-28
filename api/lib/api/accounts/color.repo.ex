defmodule Api.Accounts.Color.Repo do
  import Ecto.Query
  alias Api.Accounts.Color
  alias Api.Repo

  def get_color(id) do
    Repo.get(Color, id)
  end

  def get_color_by_name(name) do
    Repo.get_by(Color, name: name)
  end

  def list_colors do
    Repo.all(from c in Color, order_by: c.id)
  end
end
