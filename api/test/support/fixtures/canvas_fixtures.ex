defmodule Api.CanvasFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Api.Canvas` context.
  """

  @doc """
  Generate a pixel.
  """
  def pixel_fixture(attrs \\ %{}) do
    {:ok, pixel} =
      attrs
      |> Enum.into(%{
        x: 42,
        y: 42
      })
      |> Api.Canvas.create_pixel()

    pixel
  end
end
