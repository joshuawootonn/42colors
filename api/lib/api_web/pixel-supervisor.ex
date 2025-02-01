defmodule ApiWeb.PixelSupervisor do
  use GenServer
  alias Api.Canvas

  # Client API
  def start_link(arg) do
    GenServer.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def list_pixels() do
    GenServer.call(__MODULE__, :list_pixels)
    |> Map.get(:pixels)
  end

  def list_encoded_pixels() do
    GenServer.call(__MODULE__, :list_pixels)
    |> Map.get(:binary_pixels)
  end

  @impl true
  def init(_init_args) do
    pixels = Canvas.list_pixels()

    formatted_pixels =
      %Pixels{
        pixels:
          Enum.map(pixels, fn pixel ->
            %Pixel{x: pixel.x, y: pixel.y, color: 0, id: pixel.id}
          end)
      }

    binary_pixels =
      Pixels.encode(formatted_pixels)

    {:ok, %{pixels: pixels, binary_pixels: binary_pixels}}
  end

  @impl true
  def handle_call(:list_pixels, _from, pixels) do
    {:reply, pixels, pixels}
  end
end
