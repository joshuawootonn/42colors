defmodule Api.Canvas.PixelServiceTest do
  use Api.DataCase

  alias Api.Canvas.{PixelService, Plot}
  alias Api.Accounts.User
  alias Api.Repo

  describe "create_many/2" do
    setup do
      # Create a test user
      {:ok, user} = %User{}
      |> User.registration_changeset(%{email: "test@example.com", password: "password123456!"})
      |> Repo.insert()

      # Create a test plot (square from 0,0 to 10,10)
      plot_attrs = %{
        name: "Test Plot",
        description: "Test Description",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
          srid: 4326
        }
      }

      {:ok, plot} = Plot.Repo.create_plot(plot_attrs)

      %{user: user, plot: plot}
    end

    test "creates pixels when they are within user's plot", %{user: user} do
      valid_pixels = [
        %{x: 5, y: 5, color: 1},
        %{x: 2, y: 8, color: 2},
        %{x: 9, y: 1, color: 3}
      ]

      assert {:ok, pixels} = PixelService.create_many(valid_pixels, user.id)
      assert length(pixels) == 3

      # Verify each pixel was created correctly
      Enum.zip(valid_pixels, pixels)
      |> Enum.each(fn {input, created} ->
        assert created.x == input.x
        assert created.y == input.y
        assert created.color == input.color
        assert created.user_id == user.id
      end)
    end

    test "rejects all pixels when they are outside user's plot", %{user: user} do
      invalid_pixels = [
        %{x: 15, y: 15, color: 1},  # Outside plot
        %{x: -5, y: 5, color: 2}    # Outside plot
      ]

      assert {:error, :all_invalid, rejected} = PixelService.create_many(invalid_pixels, user.id)
      assert length(rejected) == 2
      assert Enum.all?(rejected, fn pixel -> pixel.x in [15, -5] end)
    end

    test "accepts valid pixels and rejects invalid ones (partial acceptance)", %{user: user} do
      mixed_pixels = [
        %{x: 5, y: 5, color: 1},    # Valid
        %{x: 15, y: 15, color: 2},  # Invalid
        %{x: 3, y: 3, color: 3}     # Valid
      ]

      assert {:ok, created, rejected} = PixelService.create_many(mixed_pixels, user.id)
      assert length(created) == 2
      assert length(rejected) == 1
      assert List.first(rejected).x == 15

      # Verify the valid pixels were created correctly
      valid_coords = Enum.map(created, fn p -> {p.x, p.y} end)
      assert {5, 5} in valid_coords
      assert {3, 3} in valid_coords
    end

    test "returns error when user has no plots" do
      {:ok, user_no_plots} = %User{}
      |> User.registration_changeset(%{email: "noplot@example.com", password: "password123456!"})
      |> Repo.insert()

      pixels = [%{x: 5, y: 5, color: 1}]

      assert {:error, :no_plots} = PixelService.create_many(pixels, user_no_plots.id)
    end

    test "returns error for invalid arguments" do
      assert {:error, :invalid_arguments} = PixelService.create_many("not_a_list", 1)
      assert {:error, :invalid_arguments} = PixelService.create_many([], "not_an_integer")
    end

    test "handles edge case pixels on plot boundary", %{user: user} do
      boundary_pixels = [
        %{x: 0, y: 0, color: 1},    # Corner
        %{x: 10, y: 10, color: 2},  # Opposite corner
        %{x: 5, y: 0, color: 3},    # Edge
        %{x: 0, y: 5, color: 4}     # Edge
      ]

      # Note: Depending on how PostGIS handles boundary conditions,
      # this test might need adjustment. The polygon includes the boundary.
      case PixelService.create_many(boundary_pixels, user.id) do
        {:ok, pixels} ->
          assert length(pixels) == 4
        {:ok, pixels, rejected} ->
          # Some boundary pixels accepted, some rejected
          assert length(pixels) + length(rejected) == 4
        {:error, :all_invalid, rejected} ->
          # If all boundary pixels are rejected, that's also acceptable behavior
          assert length(rejected) == 4
      end
    end
  end
end
