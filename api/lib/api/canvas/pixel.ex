defmodule Api.Canvas.Pixel do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pixels" do
    field(:y, :integer)
    field(:x, :integer)
    field(:color, :integer)
    field(:user_id, :integer)
    belongs_to :plot, Api.Plots.Plot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(pixel, attrs) do
    pixel
    |> cast(attrs, [:x, :y, :color, :user_id, :plot_id])
    |> validate_required([:x, :y, :color, :user_id])
  end
end
