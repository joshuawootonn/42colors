defmodule Api.Canvas.Pixel do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pixels" do
    field(:y, :integer)
    field(:x, :integer)
    field(:color_ref, :integer)
    belongs_to :user, Api.Accounts.User
    belongs_to :plot, Api.Canvas.Plot

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(pixel, attrs) do
    pixel
    |> cast(attrs, [:x, :y, :color_ref, :user_id, :plot_id])
    |> validate_required([:x, :y, :color_ref])
  end
end
