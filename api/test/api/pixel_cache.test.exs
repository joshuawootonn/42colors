ExUnit.start()

defmodule AssertionTest do
  use ExUnit.Case, async: false
  alias Api.PixelCache
  alias ApiWeb.TelemetryHelper
  alias Api.Canvas
  alias Api.Repo

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})
  end

  test "happy path" do
    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    initial_list = [
      %{x: 1, y: 1},
      %{x: 2, y: 2},
      %{x: 3, y: 2},
      %{x: 4, y: 2}
    ]

    Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
    pixels = Canvas.list_pixels()

    TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    #
    cached_pixels =
      TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
        PixelCache.read_sub_section_of_file()
      end)

    assert Enum.sort(initial_list) == Enum.sort(cached_pixels)
  end

  test "negative numbers" do
    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    initial_list = [
      %{x: 1, y: -1},
      %{x: 2, y: 2},
      %{x: 3, y: -2},
      %{x: 4, y: 2}
    ]

    Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
    pixels = Canvas.list_pixels()

    TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    #
    cached_pixels =
      TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
        PixelCache.read_sub_section_of_file()
      end)

    assert Enum.sort(initial_list) == Enum.sort(cached_pixels)
  end

  test "out of bounds numbers are ignored" do
    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    initial_list = [
      %{x: 2, y: 2},
      %{x: 3, y: -2},
      %{x: 4, y: 2},
      %{x: -4, y: 2},
      %{x: -5, y: -5},
      %{x: -6, y: -1}
    ]

    Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
    pixels = Canvas.list_pixels()

    TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    cached_pixels =
      TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
        PixelCache.read_sub_section_of_file()
      end)

    assert Enum.sort(Enum.take(initial_list, 5)) == Enum.sort(cached_pixels)
  end

  test "sub section happy path" do
    TelemetryHelper.instrument(:initialize_file, fn -> PixelCache.initialize_file() end)

    initial_list = [
      %{x: 2, y: 2},
      %{x: 4, y: 2},
      %{x: 0, y: 0},
      %{x: 4, y: 4},
      %{x: 3, y: -2},
      %{x: -6, y: -1},
      %{x: 5, y: -1},
      %{x: -2, y: -2}
    ]

    point = %{x: 2, y: 2}

    Enum.each(initial_list, fn coord -> Canvas.create_pixel(coord) end)
    pixels = Canvas.list_pixels()

    TelemetryHelper.instrument(:write_coordinates_to_file, fn ->
      PixelCache.write_coordinates_to_file(pixels)
    end)

    cached_pixels =
      TelemetryHelper.instrument(:read_sub_section_of_file, fn ->
        PixelCache.read_sub_section_of_file(point)
      end)

    assert Enum.sort(Enum.take(initial_list, 4)) == Enum.sort(cached_pixels)
  end
end
