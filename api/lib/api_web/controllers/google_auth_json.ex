defmodule ApiWeb.GoogleAuthJSON do
  @doc """
  Renders a the login URL
  """
  def show(url) do
    %{
      data: %{
        url: url.url
      }
    }
  end
end
