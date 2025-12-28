defmodule Api.Accounts.Color do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :integer, autogenerate: false}
  schema "colors" do
    field :name, :string
    field :hex_code, :string

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(color, attrs) do
    color
    |> cast(attrs, [:id, :name, :hex_code])
    |> validate_required([:id, :name, :hex_code])
    |> unique_constraint(:name)
  end
end
