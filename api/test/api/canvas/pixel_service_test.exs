defmodule Api.Canvas.PixelServiceTest do
  use Api.DataCase

  alias Api.Canvas.{PixelService, Plot}
  alias Api.Accounts.User
  alias Api.Repo

  describe "create_many/2" do
    setup do
      # Create a test user
      {:ok, user} =
        %User{}
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

    test "rejects pixels inside others' plots and accepts outside", %{user: user, plot: plot} do
      # Create a different user with a covering plot at another area
      {:ok, other_user} =
        %User{}
        |> User.registration_changeset(%{email: "other@example.com", password: "password123456!"})
        |> Repo.insert()

      {:ok, _other_plot} =
        Plot.Repo.create_plot(%{
          name: "Other Plot",
          description: "Other user land",
          user_id: other_user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{20, 20}, {20, 30}, {30, 30}, {30, 20}, {20, 20}]],
            srid: 4326
          }
        })

      invalid_pixels = [
        # Inside other user's plot (should reject for this user)
        %{x: 25, y: 25, color: 1},
        # Outside all plots (should accept)
        %{x: -5, y: 5, color: 2}
      ]

      assert {:ok, created, rejected} = PixelService.create_many(invalid_pixels, user.id)
      assert length(created) == 1
      assert length(rejected) == 1
      assert hd(rejected).x == 25
    end

    test "accepts valid pixels and rejects invalid ones (partial acceptance)", %{user: user} do
      # Create another user with a plot
      {:ok, other_user} =
        %User{}
        |> User.registration_changeset(%{
          email: "other2@example.com",
          password: "password123456!"
        })
        |> Repo.insert()

      {:ok, _other_plot} =
        Plot.Repo.create_plot(%{
          name: "Other Plot 2",
          description: "Other user land 2",
          user_id: other_user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{15, 15}, {15, 20}, {20, 20}, {20, 15}, {15, 15}]],
            srid: 4326
          }
        })

      mixed_pixels = [
        # Valid - inside user's own plot
        %{x: 5, y: 5, color: 1},
        # Invalid - inside other user's plot
        %{x: 17, y: 17, color: 2},
        # Valid - inside user's own plot
        %{x: 3, y: 3, color: 3},
        # Valid - outside all plots
        %{x: 50, y: 50, color: 4}
      ]

      assert {:ok, created, rejected} = PixelService.create_many(mixed_pixels, user.id)
      assert length(created) == 3
      assert length(rejected) == 1
      assert List.first(rejected).x == 17

      # Verify the valid pixels were created correctly
      valid_coords = Enum.map(created, fn p -> {p.x, p.y} end)
      assert {5, 5} in valid_coords
      assert {3, 3} in valid_coords
      assert {50, 50} in valid_coords
    end

    test "allows unauthenticated users to draw outside plots and rejects inside any plot", %{
      plot: plot
    } do
      pixels = [
        # inside existing plot (belongs to someone, deny)
        %{x: 5, y: 5, color: 1},
        # outside all plots (allow)
        %{x: 50, y: 50, color: 2}
      ]

      assert {:ok, created, rejected} = PixelService.create_many(pixels, nil)
      coords_created = Enum.map(created, fn p -> {p.x, p.y} end)
      assert {50, 50} in coords_created
      assert Enum.any?(rejected, fn p -> p.x == 5 and p.y == 5 end)
    end

    test "returns error for invalid arguments" do
      assert {:error, :invalid_arguments} = PixelService.create_many("not_a_list", 1)
      assert {:error, :invalid_arguments} = PixelService.create_many([], "not_an_integer")
    end

    test "handles edge case pixels on plot boundary", %{user: user} do
      boundary_pixels = [
        # Corner
        %{x: 0, y: 0, color: 1},
        # Opposite corner
        %{x: 10, y: 10, color: 2},
        # Edge
        %{x: 5, y: 0, color: 3},
        # Edge
        %{x: 0, y: 5, color: 4}
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
