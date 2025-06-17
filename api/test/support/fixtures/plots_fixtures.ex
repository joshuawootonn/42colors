defmodule Api.PlotsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Api.Plots` context.
  """

  alias Api.AccountsFixtures

  @doc """
  Generate a plot.
  """
  def plot_fixture(attrs \\ %{}) do
    user = Map.get(attrs, :user_id) || AccountsFixtures.user_fixture().id

    attrs =
      Enum.into(attrs, %{
        name: "Test Plot #{System.unique_integer([:positive])}",
        description: "Test Description",
        user_id: user
      })

    {:ok, plot} = Api.Plots.create_plot(attrs)
    plot
  end
end
