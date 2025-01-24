defmodule ApiWeb.MeJSON do
  @doc """
  Renders a the authed user
  """
  def show(user) do
    %{
      data: %{
        name: user.name,
        email: user.email
      }
    }
  end
end
