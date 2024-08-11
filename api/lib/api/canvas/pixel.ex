defmodule Api.Canvas.Pixel do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pixels" do
    field :y, :integer
    field :x, :integer

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(pixel, attrs) do
    pixel
    |> cast(attrs, [:x, :y])
    |> validate_required([:x, :y])
  end
end
