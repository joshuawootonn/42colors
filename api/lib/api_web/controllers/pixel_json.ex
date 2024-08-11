defmodule ApiWeb.PixelJSON do
  alias Api.Canvas.Pixel

  @doc """
  Renders a list of pixels.
  """
  def index(%{pixels: pixels}) do
    %{data: for(pixel <- pixels, do: data(pixel))}
  end

  @doc """
  Renders a single pixel.
  """
  def show(%{pixel: pixel}) do
    %{data: data(pixel)}
  end

  defp data(%Pixel{} = pixel) do
    %{
      id: pixel.id,
      x: pixel.x,
      y: pixel.y
    }
  end
end
