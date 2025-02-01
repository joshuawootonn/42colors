defmodule ApiWeb.PixelSupervisor do
  use GenServer
  alias Api.Canvas

  # Client API
  def start_link(arg) do
    GenServer.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def list_pixels() do
    GenServer.call(__MODULE__, :list_pixels)
  end

  @impl true
  def init(_init_args) do
    pixels = Canvas.list_pixels()
    {:ok, pixels}
  end

  @impl true
  def handle_call(:list_pixels, _from, pixels) do
    {:reply, pixels, pixels}
  end
end
