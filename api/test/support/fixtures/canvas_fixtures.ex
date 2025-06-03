defmodule Api.CanvasFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Api.Canvas` context.
  """
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
        color: 1,
        user_id: user.id
      })
      |> Api.Canvas.create_pixel()

    pixel
  end
end
