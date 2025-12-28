defmodule Api.Accounts.UsernameCount do
  use Ecto.Schema
  import Ecto.Changeset

  schema "username_counts" do
    field :count, :integer, default: 0
    belongs_to :color, Api.Accounts.Color

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(username_count, attrs) do
    username_count
    |> cast(attrs, [:color_id, :count])
    |> validate_required([:color_id, :count])
    |> foreign_key_constraint(:color_id)
    |> unique_constraint(:color_id)
  end
end
