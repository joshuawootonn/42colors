defmodule Api.CanvasFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Api.Canvas` context.
  """
  def unique_user_email, do: "user#{System.unique_integer()}@example.com"
  def valid_user_password, do: "hello world!"
  def valid_user_attributes(attrs \\ %{}) do
    Enum.into(attrs, %{
      email: unique_user_email(),
      password: valid_user_password()
    })
  end
  @doc """
  Generate a pixel.
  """
  def pixel_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> valid_user_attributes()
      |> Api.Accounts.register_user()

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
