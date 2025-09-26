defmodule Api.CanvasFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Api.Canvas.Pixel.Repo` context.
  """

  alias Api.AccountsFixtures

  @doc """
  Generate a pixel.
  """
  def pixel_fixture(attrs \\ %{}) do
    user =
      attrs
      |> Api.AccountsFixtures.valid_user_attributes()
      |> Api.AccountsFixtures.user_fixture()

    {:ok, pixel} =
      attrs
      |> Enum.into(%{
        x: 42,
        y: 42,
        color_ref: 1,
        user_id: user.id
      })
      |> Api.Canvas.Pixel.Repo.create_pixel()

    pixel
  end

  def plot_fixture(attrs \\ %{}) do
    user = Map.get(attrs, :user_id) || AccountsFixtures.user_fixture().id

    attrs =
      Enum.into(attrs, %{
        name: "Test Plot #{System.unique_integer([:positive])}",
        description: "Test Description",
        user_id: user,
        polygon: %Geo.Polygon{coordinates: [[{0, 0}, {0, 1}, {1, 1}, {1, 0}, {0, 0}]], srid: 4326}
      })

    {:ok, plot} = Api.Canvas.Plot.Repo.create_plot(attrs)
    plot
  end
end
