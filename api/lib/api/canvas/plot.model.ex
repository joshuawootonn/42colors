defmodule Api.Canvas.Plot do
  use Ecto.Schema
  import Ecto.Changeset

  schema "plots" do
    field :name, :string
    field :description, :string
    field :polygon, Geo.PostGIS.Geometry
    field :deleted_at, :utc_datetime
    belongs_to :user, Api.Accounts.User
    has_many :pixels, Api.Canvas.Pixel

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(plot, attrs) do
    plot
    |> cast(attrs, [:name, :description, :user_id, :polygon, :deleted_at])
    |> validate_required([:name], message: "Name is required")
    |> validate_required([:user_id], message: "User is required")
    |> validate_length(:name,
      min: 1,
      max: 255,
      message: "Name must be between 1 and 255 characters"
    )
    |> validate_length(:description,
      max: 1000,
      message: "Description must be less than 1000 characters"
    )
    |> foreign_key_constraint(:user_id, message: "User does not exist")
    |> unique_constraint([:name, :user_id],
      name: :plots_name_user_id_deleted_at_null_index,
      message: "You already have a plot with this name"
    )
  end

  @doc """
  Soft deletes a plot by setting deleted_at timestamp.
  """
  def soft_delete_changeset(plot) do
    changeset(plot, %{deleted_at: DateTime.utc_now()})
  end
end
