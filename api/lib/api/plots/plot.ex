defmodule Api.Plots.Plot do
  use Ecto.Schema
  import Ecto.Changeset

  schema "plots" do
    field :name, :string
    field :description, :string
    field :polygon, Geo.PostGIS.Geometry
    belongs_to :user, Api.Accounts.User
    has_many :pixels, Api.Canvas.Pixel

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(plot, attrs) do
    plot
    |> cast(attrs, [:name, :description, :user_id, :polygon])
    |> validate_required([:name, :user_id])
    |> foreign_key_constraint(:user_id)
    |> unique_constraint([:name, :user_id], name: :plots_name_user_id_index)
  end
end
