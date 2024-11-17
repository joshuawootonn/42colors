defmodule ApiWeb.MeJSON do
  @doc """
  Renders a the authed user
  """
  def show(profile) do
    %{
      data: %{
        name: profile.profile.name,
        email: profile.profile.email
      }
    }
  end
end
