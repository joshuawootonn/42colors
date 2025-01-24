defmodule Api.Account do
  use Ecto.Schema
  import Ecto.Changeset

  alias Api.Accounts.{User}

  schema "accounts" do
    field :scope, :string
    field :access_token, :string
    field :expires_in, :integer
    field :id_token, :string
    field :token_type, :string
    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(account, attrs) do
    account
    |> cast(attrs, [:user_id, :scope, :access_token, :expires_in, :id_token, :token_type])
    |> validate_required([:user_id, :scope, :access_token, :expires_in, :id_token, :token_type])
  end
end
