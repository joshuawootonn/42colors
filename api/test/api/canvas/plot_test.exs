defmodule Api.PlotTest do
  use Api.DataCase

  alias Api.Canvas.Plot

  import Api.CanvasFixtures
  import Api.AccountsFixtures

  describe "plots" do
    alias Api.Canvas.Plot

    @invalid_attrs %{name: nil, description: nil}

    test "list_user_plots/1 returns all plots for a user" do
      user = user_fixture()
      plot = plot_fixture(%{user_id: user.id})
      assert Plot.Repo.list_user_plots(user.id) == [plot]
    end

    test "get_plot!/1 returns the plot with given id" do
      plot = plot_fixture()
      assert Plot.Repo.get_plot!(plot.id) == plot
    end

    test "get_user_plot!/2 returns the plot with given id for specific user" do
      user = user_fixture()
      plot = plot_fixture(%{user_id: user.id})
      assert Plot.Repo.get_user_plot!(plot.id, user.id) == plot
    end

    test "get_user_plot!/2 returns nil for non-existent plot" do
      user = user_fixture()
      assert Plot.Repo.get_user_plot!(123, user.id) == nil
    end

    test "create_plot/1 with valid data creates a plot" do
      user = user_fixture()
      valid_attrs = %{name: "Test Plot", description: "Test Description", user_id: user.id}

      assert {:ok, %Plot{} = plot} = Plot.Repo.create_plot(valid_attrs)
      assert plot.name == "Test Plot"
      assert plot.description == "Test Description"
      assert plot.user_id == user.id
    end

    test "create_plot/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Plot.Repo.create_plot(@invalid_attrs)
    end

    test "update_plot/2 with valid data updates the plot" do
      plot = plot_fixture()
      update_attrs = %{name: "Updated Plot", description: "Updated Description"}

      assert {:ok, %Plot{} = plot} = Plot.Repo.update_plot(plot, update_attrs)
      assert plot.name == "Updated Plot"
      assert plot.description == "Updated Description"
    end

    test "update_plot/2 with invalid data returns error changeset" do
      plot = plot_fixture()
      assert {:error, %Ecto.Changeset{}} = Plot.Repo.update_plot(plot, @invalid_attrs)
      assert plot == Plot.Repo.get_plot!(plot.id)
    end

    test "delete_plot/1 deletes the plot" do
      plot = plot_fixture()
      assert {:ok, %Plot{}} = Plot.Repo.delete_plot(plot)
      assert_raise Ecto.NoResultsError, fn -> Plot.Repo.get_plot!(plot.id) end
    end

    test "change_plot/1 returns a plot changeset" do
      plot = plot_fixture()
      assert %Ecto.Changeset{} = Plot.Repo.change_plot(plot)
    end
  end

  describe "list_plots_within_polygon/1" do
    setup do
      user1 = user_fixture()
      user2 = user_fixture()

      # Create plots with different spatial relationships
      # Plot 1: Small square at (0,0) to (5,5) - completely within search area
      {:ok, plot1} =
        Plot.Repo.create_plot(%{
          name: "Small Plot",
          description: "Small plot completely within search area",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 5}, {5, 5}, {5, 0}, {0, 0}]],
            srid: 4326
          }
        })

      # Plot 2: Large square at (-5,-5) to (15,15) - intersects with search area
      {:ok, plot2} =
        Plot.Repo.create_plot(%{
          name: "Large Plot",
          description: "Large plot intersecting with search area",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{-5, -5}, {-5, 15}, {15, 15}, {15, -5}, {-5, -5}]],
            srid: 4326
          }
        })

      # Plot 3: Remote square at (20,20) to (25,25) - completely outside search area
      {:ok, plot3} =
        Plot.Repo.create_plot(%{
          name: "Remote Plot",
          description: "Remote plot outside search area",
          user_id: user2.id,
          polygon: %Geo.Polygon{
            coordinates: [[{20, 20}, {20, 25}, {25, 25}, {25, 20}, {20, 20}]],
            srid: 4326
          }
        })

      # Plot 4: Edge case - shares boundary with search area
      {:ok, plot4} =
        Plot.Repo.create_plot(%{
          name: "Edge Plot",
          description: "Plot sharing boundary with search area",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{10, 5}, {10, 15}, {15, 15}, {15, 5}, {10, 5}]],
            srid: 4326
          }
        })

      # Plot 5: No polygon (should be excluded)
      {:ok, plot5} =
        Plot.Repo.create_plot(%{
          name: "No Polygon Plot",
          description: "Plot without polygon",
          user_id: user1.id,
          polygon: nil
        })

      # Search polygon: (0,0) to (10,10)
      search_polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      %{
        user1: user1,
        user2: user2,
        plot1: plot1,
        plot2: plot2,
        plot3: plot3,
        plot4: plot4,
        plot5: plot5,
        search_polygon: search_polygon
      }
    end

    test "returns plots that intersect with the search polygon", %{
      plot1: plot1,
      plot2: plot2,
      plot4: plot4,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_within_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should include plots that intersect (plot1, plot2, plot4)
      assert plot1.id in result_ids
      assert plot2.id in result_ids
      assert plot4.id in result_ids

      # Should have exactly 3 results
      assert length(results) == 3
    end

    test "excludes plots that are completely outside the search polygon", %{
      plot3: plot3,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_within_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should not include plot3 (remote plot)
      refute plot3.id in result_ids
    end

    test "excludes plots with nil polygon", %{
      plot5: plot5,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_within_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should not include plot5 (no polygon)
      refute plot5.id in result_ids
    end

    test "returns empty list when no plots intersect with search polygon" do
      # Search in a remote area where no plots exist
      remote_polygon = %Geo.Polygon{
        coordinates: [[{100, 100}, {100, 110}, {110, 110}, {110, 100}, {100, 100}]],
        srid: 4326
      }

      results = Plot.Repo.list_plots_within_polygon(remote_polygon)
      assert results == []
    end

    test "handles edge case with touching boundaries", %{
      plot4: plot4
    } do
      # Search polygon that just touches plot4's boundary
      touching_polygon = %Geo.Polygon{
        coordinates: [[{5, 5}, {5, 10}, {10, 10}, {10, 5}, {5, 5}]],
        srid: 4326
      }

      results = Plot.Repo.list_plots_within_polygon(touching_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should include plot4 since boundaries touch (ST_Intersects includes touching)
      assert plot4.id in result_ids
    end

    test "works with complex polygon shapes" do
      user = user_fixture()

      # Create a plot with a more complex polygon (L-shape)
      {:ok, l_shaped_plot} =
        Plot.Repo.create_plot(%{
          name: "L-Shaped Plot",
          description: "Complex L-shaped plot",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 10}, {5, 10}, {5, 5}, {10, 5}, {10, 0}, {0, 0}]],
            srid: 4326
          }
        })

      # Search with a polygon that intersects part of the L-shape
      search_polygon = %Geo.Polygon{
        coordinates: [[{3, 3}, {3, 7}, {7, 7}, {7, 3}, {3, 3}]],
        srid: 4326
      }

      results = Plot.Repo.list_plots_within_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      assert l_shaped_plot.id in result_ids
    end

    test "returns error for invalid polygon input" do
      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_within_polygon("not a polygon")
      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_within_polygon(nil)
      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_within_polygon(%{})
    end

    test "handles very small polygons" do
      user = user_fixture()

      # Create a very small plot
      {:ok, tiny_plot} =
        Plot.Repo.create_plot(%{
          name: "Tiny Plot",
          description: "Very small plot",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{1.0, 1.0}, {1.0, 1.1}, {1.1, 1.1}, {1.1, 1.0}, {1.0, 1.0}]],
            srid: 4326
          }
        })

      # Search with a polygon that covers the tiny plot
      search_polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 2}, {2, 2}, {2, 0}, {0, 0}]],
        srid: 4326
      }

      results = Plot.Repo.list_plots_within_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      assert tiny_plot.id in result_ids
    end

    test "handles overlapping plots" do
      user = user_fixture()

      # Create two overlapping plots
      {:ok, plot_a} =
        Plot.Repo.create_plot(%{
          name: "Plot A",
          description: "First overlapping plot",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 5}, {5, 5}, {5, 0}, {0, 0}]],
            srid: 4326
          }
        })

      {:ok, plot_b} =
        Plot.Repo.create_plot(%{
          name: "Plot B",
          description: "Second overlapping plot",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{3, 3}, {3, 8}, {8, 8}, {8, 3}, {3, 3}]],
            srid: 4326
          }
        })

      # Search polygon that intersects both
      search_polygon = %Geo.Polygon{
        coordinates: [[{2, 2}, {2, 6}, {6, 6}, {6, 2}, {2, 2}]],
        srid: 4326
      }

      results = Plot.Repo.list_plots_within_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      assert plot_a.id in result_ids
      assert plot_b.id in result_ids
      assert length(results) >= 2
    end
  end
end
