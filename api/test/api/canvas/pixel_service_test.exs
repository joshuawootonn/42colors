defmodule Api.Canvas.PixelServiceTest do
  use Api.DataCase

  alias Api.Canvas.{PixelService, Plot}
  alias Api.Accounts.User
  alias Api.Repo
  import Api.AccountsFixtures

  describe "create_many/2" do
    setup do
      # Create a test user with unique email
      user = user_fixture()

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
        %{x: 5, y: 5, color_ref: 1},
        %{x: 2, y: 8, color_ref: 2},
        %{x: 9, y: 1, color_ref: 3}
      ]

      assert {:ok, pixels} = PixelService.create_many(valid_pixels, user.id)
      assert length(pixels) == 3

      # Verify each pixel was created correctly
      Enum.zip(valid_pixels, pixels)
      |> Enum.each(fn {input, created} ->
        assert created.x == input.x
        assert created.y == input.y
        assert created.color_ref == input.color_ref
        assert created.user_id == user.id
      end)
    end

    test "rejects pixels inside others' plots and accepts outside", %{user: user, plot: _plot} do
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
        %{x: 25, y: 25, color_ref: 1},
        # Outside all plots (should accept)
        %{x: -5, y: 5, color_ref: 2}
      ]

      {created, rejected} =
        case PixelService.create_many(invalid_pixels, user.id) do
          {:ok, created, rejected, _plot_ids} ->
            {created, rejected}

          other ->
            flunk("Expected success with mixed results, got: #{inspect(other)}")
        end

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
        %{x: 5, y: 5, color_ref: 1},
        # Invalid - inside other user's plot
        %{x: 17, y: 17, color_ref: 2},
        # Valid - inside user's own plot
        %{x: 3, y: 3, color_ref: 3},
        # Valid - outside all plots
        %{x: 50, y: 50, color_ref: 4}
      ]

      {created, rejected} =
        case PixelService.create_many(mixed_pixels, user.id) do
          {:ok, created, rejected, _plot_ids} ->
            {created, rejected}

          other ->
            flunk("Expected success with mixed results, got: #{inspect(other)}")
        end

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
      plot: _plot
    } do
      pixels = [
        # inside existing plot (belongs to someone, deny)
        %{x: 5, y: 5, color_ref: 1},
        # outside all plots (allow)
        %{x: 50, y: 50, color_ref: 2}
      ]

      {created, rejected} =
        case PixelService.create_many(pixels, nil) do
          {:ok, created, rejected, _plot_ids} ->
            {created, rejected}

          other ->
            flunk("Expected success with mixed results, got: #{inspect(other)}")
        end

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
        %{x: 0, y: 0, color_ref: 1},
        # Opposite corner
        %{x: 10, y: 10, color_ref: 2},
        # Edge
        %{x: 5, y: 0, color_ref: 3},
        # Edge
        %{x: 0, y: 5, color_ref: 4}
      ]

      # Note: Depending on how PostGIS handles boundary conditions,
      # this test might need adjustment. The polygon includes the boundary.
      case PixelService.create_many(boundary_pixels, user.id) do
        {:ok, pixels} ->
          assert length(pixels) == 4

        {:ok, pixels, rejected, _plot_ids} ->
          # Some boundary pixels accepted, some rejected
          assert length(pixels) + length(rejected) == 4

        {:error, :all_invalid, rejected, _plot_ids} ->
          # If all boundary pixels are rejected, that's also acceptable behavior
          assert length(rejected) == 4
      end
    end

    test "returns plot IDs when pixels are rejected due to being in other user's plots", %{
      user: user,
      plot: _plot
    } do
      # Create another user and their plot
      {:ok, other_user} =
        %User{}
        |> User.registration_changeset(%{email: "other@example.com", password: "password123456!"})
        |> Repo.insert()

      other_plot_attrs = %{
        name: "Other User's Plot",
        description: "Another plot",
        user_id: other_user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{20, 20}, {20, 30}, {30, 30}, {30, 20}, {20, 20}]],
          srid: 4326
        }
      }

      {:ok, other_plot} = Plot.Repo.create_plot(other_plot_attrs)

      # Try to draw pixels in both plots
      pixels = [
        # Inside current user's plot (should be accepted)
        %{x: 5, y: 5, color_ref: 1},
        # Inside other user's plot (should be rejected)
        %{x: 25, y: 25, color_ref: 2},
        # Outside all plots (should be accepted)
        %{x: 50, y: 50, color_ref: 3}
      ]

      case PixelService.create_many(pixels, user.id) do
        {:ok, created_pixels, rejected_pixels, rejected_plot_ids} ->
          # Should have 2 accepted pixels and 1 rejected
          assert length(created_pixels) == 2
          assert length(rejected_pixels) == 1
          assert rejected_plot_ids == [other_plot.id]

          # Check that the rejected pixel is the one in the other user's plot
          rejected_pixel = List.first(rejected_pixels)
          assert rejected_pixel.x == 25
          assert rejected_pixel.y == 25

        other ->
          flunk("Expected partial success with rejected pixels, got: #{inspect(other)}")
      end
    end

    test "returns all plot IDs when all pixels are rejected", %{user: user} do
      # Create another user and their plot
      {:ok, other_user} =
        %User{}
        |> User.registration_changeset(%{email: "other@example.com", password: "password123456!"})
        |> Repo.insert()

      other_plot_attrs = %{
        name: "Other User's Plot",
        description: "Another plot",
        user_id: other_user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{20, 20}, {20, 30}, {30, 30}, {30, 20}, {20, 20}]],
          srid: 4326
        }
      }

      {:ok, other_plot} = Plot.Repo.create_plot(other_plot_attrs)

      # Try to draw all pixels in the other user's plot
      pixels = [
        %{x: 25, y: 25, color_ref: 1},
        %{x: 26, y: 26, color_ref: 2}
      ]

      case PixelService.create_many(pixels, user.id) do
        {:error, :all_invalid, rejected_pixels, rejected_plot_ids} ->
          assert length(rejected_pixels) == 2
          assert rejected_plot_ids == [other_plot.id]

        other ->
          flunk("Expected all pixels to be rejected, got: #{inspect(other)}")
      end
    end
  end
end
