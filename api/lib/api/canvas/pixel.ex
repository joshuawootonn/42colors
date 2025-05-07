defmodule Api.Canvas.Pixel do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pixels" do
    field(:y, :integer)
    field(:x, :integer)
    field(:color, :integer)
    field(:user_id, :integer)

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(pixel, attrs) do
    pixel
    |> cast(attrs, [:x, :y, :color, :user_id])
    |> validate_required([:x, :y, :color, :user_id])
  end
end
