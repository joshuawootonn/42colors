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

    test "delete_plot/1 soft deletes the plot" do
      plot = plot_fixture()
      assert {:ok, %Plot{} = deleted_plot} = Plot.Repo.delete_plot(plot)

      # Plot should have deleted_at timestamp
      assert deleted_plot.deleted_at != nil

      # Plot should not be found by normal queries
      assert_raise Ecto.NoResultsError, fn -> Plot.Repo.get_plot!(plot.id) end

      # Plot should not appear in user plots list
      assert Plot.Repo.list_user_plots(plot.user_id) == []
    end

    test "change_plot/1 returns a plot changeset" do
      plot = plot_fixture()
      assert %Ecto.Changeset{} = Plot.Repo.change_plot(plot)
    end

    test "allows reusing plot names after soft deletion" do
      user = user_fixture()
      plot_name = "Reusable Plot Name"

      # Create first plot
      assert {:ok, %Plot{} = plot1} =
               Plot.Repo.create_plot(%{
                 name: plot_name,
                 description: "First plot with this name",
                 user_id: user.id
               })

      # Verify we can't create another plot with the same name
      assert {:error, %Ecto.Changeset{}} =
               Plot.Repo.create_plot(%{
                 name: plot_name,
                 description: "Duplicate name should fail",
                 user_id: user.id
               })

      # Soft delete the first plot
      assert {:ok, %Plot{}} = Plot.Repo.delete_plot(plot1)

      # Now we should be able to create a new plot with the same name
      assert {:ok, %Plot{} = plot2} =
               Plot.Repo.create_plot(%{
                 name: plot_name,
                 description: "Second plot reusing the name",
                 user_id: user.id
               })

      # Verify the new plot is different from the deleted one
      assert plot2.id != plot1.id
      assert plot2.description == "Second plot reusing the name"

      # Verify only the new plot appears in user plots list
      user_plots = Plot.Repo.list_user_plots(user.id)
      assert length(user_plots) == 1
      assert hd(user_plots).id == plot2.id
    end

    test "unique constraint still works for active plots" do
      user = user_fixture()
      plot_name = "Unique Active Plot"

      # Create first plot
      assert {:ok, %Plot{}} =
               Plot.Repo.create_plot(%{
                 name: plot_name,
                 description: "First active plot",
                 user_id: user.id
               })

      # Try to create another plot with the same name (should fail)
      assert {:error, %Ecto.Changeset{errors: errors}} =
               Plot.Repo.create_plot(%{
                 name: plot_name,
                 description: "Duplicate active plot",
                 user_id: user.id
               })

      # Verify the error is about the unique constraint
      assert Keyword.has_key?(errors, :name)
    end
  end

  describe "plots_covering_points/1 – non-rectangular semantics" do
    test "axis-aligned rectangle: interior, corners, and edge midpoints (half-open)" do
      user = user_fixture()

      plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 4}, {6, 4}, {6, 0}, {0, 0}]],
            srid: 4326
          }
        })

      points = [
        # interior
        %Geo.Point{coordinates: {1, 1}, srid: 4326},
        %Geo.Point{coordinates: {5, 3}, srid: 4326},

        # corners
        # include
        %Geo.Point{coordinates: {0, 0}, srid: 4326},
        # exclude
        %Geo.Point{coordinates: {6, 4}, srid: 4326},
        # exclude (right edge)
        %Geo.Point{coordinates: {6, 0}, srid: 4326},
        # exclude (bottom edge)
        %Geo.Point{coordinates: {0, 4}, srid: 4326},

        # edge midpoints
        # top include
        %Geo.Point{coordinates: {3, 0}, srid: 4326},
        # left include
        %Geo.Point{coordinates: {0, 2}, srid: 4326},
        # bottom exclude
        %Geo.Point{coordinates: {3, 4}, srid: 4326},
        # right exclude
        %Geo.Point{coordinates: {6, 2}, srid: 4326}
      ]

      result = Plot.Repo.plots_covering_points(points)

      expected = %{
        {1, 1} => %{plot_id: plot.id, user_id: user.id},
        {5, 3} => %{plot_id: plot.id, user_id: user.id},
        {0, 0} => %{plot_id: plot.id, user_id: user.id},
        {3, 0} => %{plot_id: plot.id, user_id: user.id},
        {0, 2} => %{plot_id: plot.id, user_id: user.id}
      }

      # Excluded
      refute Map.has_key?(result, {6, 4})
      refute Map.has_key?(result, {6, 0})
      refute Map.has_key?(result, {0, 4})
      refute Map.has_key?(result, {6, 2})

      assert Map.take(result, Map.keys(expected)) == expected
    end

    test "top edge points should be included (debug case)" do
      user = user_fixture()

      # Based on debug output: POLYGON((15 22,15 12,37 12,37 22,15 22))
      plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{15, 22}, {15, 12}, {37, 12}, {37, 22}, {15, 22}]],
            srid: 4326
          }
        })

      # Points that were failing: (17,12) through (23,12) - all on top edge
      points = [
        %Geo.Point{coordinates: {17, 12}, srid: 4326},
        %Geo.Point{coordinates: {18, 12}, srid: 4326},
        %Geo.Point{coordinates: {19, 12}, srid: 4326},
        %Geo.Point{coordinates: {20, 12}, srid: 4326},
        %Geo.Point{coordinates: {21, 12}, srid: 4326},
        %Geo.Point{coordinates: {22, 12}, srid: 4326},
        %Geo.Point{coordinates: {23, 12}, srid: 4326},
        # Add an interior point for comparison
        %Geo.Point{coordinates: {20, 15}, srid: 4326}
      ]

      result = Plot.Repo.plots_covering_points(points)

      # All top edge points should be included (half-open: include top)
      expected = %{
        {17, 12} => %{plot_id: plot.id, user_id: user.id},
        {18, 12} => %{plot_id: plot.id, user_id: user.id},
        {19, 12} => %{plot_id: plot.id, user_id: user.id},
        {20, 12} => %{plot_id: plot.id, user_id: user.id},
        {21, 12} => %{plot_id: plot.id, user_id: user.id},
        {22, 12} => %{plot_id: plot.id, user_id: user.id},
        {23, 12} => %{plot_id: plot.id, user_id: user.id},
        {20, 15} => %{plot_id: plot.id, user_id: user.id}
      }

      assert result == expected
    end

    test "show returned correct points for u shaped polygon" do
      user = user_fixture()

      # U-shaped polygon: Start simple and trace the outer boundary
      # Go: (0,0) -> (0,8) -> (10,8) -> (10,0) -> (7,0) -> (7,5) -> (3,5) -> (3,0) -> back to (0,0)
      _plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [
              [{0, 0}, {0, 10}, {10, 10}, {10, 0}, {8, 0}, {8, 10}, {2, 10}, {2, 0}, {0, 0}]
            ],
            srid: 4326
          }
        })

      points = [
        # Four outer corners
        # bottom-left outer corner
        %Geo.Point{coordinates: {0, 0}, srid: 4326},
        # top-left outer corner
        %Geo.Point{coordinates: {0, 10}, srid: 4326},
        # top-right outer corner
        %Geo.Point{coordinates: {10, 10}, srid: 4326},
        # bottom-right outer corner
        %Geo.Point{coordinates: {10, 0}, srid: 4326},

        # Four interior corners (U opening)
        # inner bottom-left corner
        %Geo.Point{coordinates: {2, 0}, srid: 4326},
        # inner bottom-right corner
        %Geo.Point{coordinates: {8, 0}, srid: 4326},
        # inner top-left corner
        %Geo.Point{coordinates: {2, 10}, srid: 4326},
        # inner top-right corner
        %Geo.Point{coordinates: {8, 10}, srid: 4326},

        # Points clearly inside the U arms
        # left arm interior
        %Geo.Point{coordinates: {1, 1}, srid: 4326},
        # left arm middle
        %Geo.Point{coordinates: {1, 5}, srid: 4326},
        # left arm top
        %Geo.Point{coordinates: {1, 9}, srid: 4326},
        # right arm interior
        %Geo.Point{coordinates: {9, 1}, srid: 4326},
        # right arm middle
        %Geo.Point{coordinates: {9, 5}, srid: 4326},
        # right arm top
        %Geo.Point{coordinates: {9, 9}, srid: 4326},
        %Geo.Point{coordinates: {8, 8}, srid: 4326},

        # Points inside the U opening (should be excluded)
        # opening bottom-left
        %Geo.Point{coordinates: {3, 1}, srid: 4326},
        # opening bottom-center
        %Geo.Point{coordinates: {5, 1}, srid: 4326},
        # opening bottom-right
        %Geo.Point{coordinates: {7, 1}, srid: 4326},
        # opening middle-left
        %Geo.Point{coordinates: {3, 5}, srid: 4326},
        # opening center
        %Geo.Point{coordinates: {5, 5}, srid: 4326},
        # opening middle-right
        %Geo.Point{coordinates: {7, 5}, srid: 4326},
        # opening top-left
        %Geo.Point{coordinates: {3, 9}, srid: 4326},
        # opening top-center
        %Geo.Point{coordinates: {5, 9}, srid: 4326},
        # opening top-right
        %Geo.Point{coordinates: {7, 9}, srid: 4326},

        # Edge points for boundary testing
        # left outer edge
        %Geo.Point{coordinates: {0, 5}, srid: 4326},
        # right outer edge
        %Geo.Point{coordinates: {10, 5}, srid: 4326},
        # bottom outer edge
        %Geo.Point{coordinates: {5, 0}, srid: 4326},
        # top outer edge
        %Geo.Point{coordinates: {5, 10}, srid: 4326}
      ]

      result = Plot.Repo.plots_covering_points(points)

      # Debug output to see what we get
      IO.inspect(result, label: "U-shaped polygon results")
      IO.puts("Total points found: #{map_size(result)}")

      # Points that should definitely be included (interior of U arms)
      interior_points = [
        # left arm
        {1, 1},
        {1, 5},
        {1, 9},
        # right arm (including {8,8} on interior edge)
        {9, 1},
        {9, 5},
        {9, 9},
        {8, 8}
      ]

      Enum.each(interior_points, fn point ->
        assert Map.has_key?(result, point),
               "Point #{inspect(point)} should be included (interior)"
      end)

      # Points that should definitely be excluded (inside U opening)
      opening_points = [
        # bottom row of opening
        {3, 1},
        {5, 1},
        {7, 1},
        # middle row of opening
        {3, 5},
        {5, 5},
        {7, 5},
        # top row of opening
        {3, 9},
        {5, 9},
        {7, 9}
      ]

      Enum.each(opening_points, fn point ->
        refute Map.has_key?(result, point),
               "Point #{inspect(point)} should be excluded (inside opening)"
      end)

      # Test corners and edges (results may vary based on boundary rules)
      corner_and_edge_points = [
        # outer corners
        {0, 0},
        {0, 10},
        {10, 10},
        {10, 0},
        # inner corners
        {2, 0},
        {8, 0},
        {2, 10},
        {8, 10},
        # edge midpoints
        {0, 5},
        {10, 5},
        {5, 0},
        {5, 10}
      ]

      IO.puts("Corner and edge results:")

      Enum.each(corner_and_edge_points, fn point ->
        included = Map.has_key?(result, point)
        IO.puts("  #{inspect(point)}: #{if included, do: "INCLUDED", else: "excluded"}")
      end)
    end
  end

  describe "list_plots_intersecting_polygon/1" do
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
      results = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
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
      results = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should not include plot3 (remote plot)
      refute plot3.id in result_ids
    end

    test "excludes plots with nil polygon", %{
      plot5: plot5,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
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

      results = Plot.Repo.list_plots_intersecting_polygon(remote_polygon)
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

      results = Plot.Repo.list_plots_intersecting_polygon(touching_polygon)
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

      results = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      assert l_shaped_plot.id in result_ids
    end

    test "returns error for invalid polygon input" do
      assert {:error, :invalid_polygon} =
               Plot.Repo.list_plots_intersecting_polygon("not a polygon")

      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_intersecting_polygon(nil)
      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_intersecting_polygon(%{})
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

      results = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
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

      results = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      assert plot_a.id in result_ids
      assert plot_b.id in result_ids
      assert length(results) >= 2
    end

    test "excludes soft-deleted plots from spatial queries", %{search_polygon: search_polygon} do
      user = user_fixture()

      # Create a plot that intersects with search area
      {:ok, plot} =
        Plot.Repo.create_plot(%{
          name: "To Be Deleted",
          description: "Plot that will be soft deleted",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{2, 2}, {2, 8}, {8, 8}, {8, 2}, {2, 2}]],
            srid: 4326
          }
        })

      # Verify plot is found before deletion
      results_before = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
      assert plot.id in Enum.map(results_before, & &1.id)

      # Soft delete the plot
      {:ok, _deleted_plot} = Plot.Repo.delete_plot(plot)

      # Verify plot is not found after soft deletion
      results_after = Plot.Repo.list_plots_intersecting_polygon(search_polygon)
      refute plot.id in Enum.map(results_after, & &1.id)
    end
  end

  describe "list_plots_overlapping_polygon/1" do
    setup do
      user1 = user_fixture()
      user2 = user_fixture()

      # Plot 1: Small square at (0,0) to (5,5)
      {:ok, plot1} =
        Plot.Repo.create_plot(%{
          name: "Small Plot",
          description: "Small plot",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 5}, {5, 5}, {5, 0}, {0, 0}]],
            srid: 4326
          }
        })

      # Plot 2: Overlapping plot at (3,3) to (8,8)
      {:ok, plot2} =
        Plot.Repo.create_plot(%{
          name: "Overlapping Plot",
          description: "Plot that overlaps with search area",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{3, 3}, {3, 8}, {8, 8}, {8, 3}, {3, 3}]],
            srid: 4326
          }
        })

      # Plot 3: Adjacent plot that only touches at boundary (5,0) to (10,5)
      {:ok, plot3} =
        Plot.Repo.create_plot(%{
          name: "Adjacent Plot",
          description: "Plot that shares edge with search area",
          user_id: user2.id,
          polygon: %Geo.Polygon{
            coordinates: [[{5, 0}, {5, 5}, {10, 5}, {10, 0}, {5, 0}]],
            srid: 4326
          }
        })

      # Plot 4: Completely contained plot at (1,1) to (2,2)
      {:ok, plot4} =
        Plot.Repo.create_plot(%{
          name: "Contained Plot",
          description: "Plot completely inside search area",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{1, 1}, {1, 2}, {2, 2}, {2, 1}, {1, 1}]],
            srid: 4326
          }
        })

      # Search polygon: (0,0) to (5,5)
      search_polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 5}, {5, 5}, {5, 0}, {0, 0}]],
        srid: 4326
      }

      %{
        user1: user1,
        user2: user2,
        plot1: plot1,
        plot2: plot2,
        plot3: plot3,
        plot4: plot4,
        search_polygon: search_polygon
      }
    end

    test "returns plots that overlap with the search polygon", %{
      plot2: plot2,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_overlapping_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should include plot2 which overlaps
      assert plot2.id in result_ids
    end

    test "excludes plots that only touch at boundaries", %{
      plot3: plot3,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_overlapping_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # Should not include plot3 (only touches at edge)
      refute plot3.id in result_ids
    end

    test "excludes plots that are completely contained", %{
      plot4: plot4,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_overlapping_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # ST_Overlaps excludes plots completely contained within the search polygon
      refute plot4.id in result_ids
    end

    test "excludes the search polygon itself if it exists as a plot", %{
      plot1: plot1,
      search_polygon: search_polygon
    } do
      results = Plot.Repo.list_plots_overlapping_polygon(search_polygon)
      result_ids = Enum.map(results, & &1.id)

      # plot1 has the same boundary as search_polygon, so ST_Overlaps returns false
      refute plot1.id in result_ids
    end

    test "returns error for invalid polygon input" do
      assert {:error, :invalid_polygon} =
               Plot.Repo.list_plots_overlapping_polygon("not a polygon")

      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_overlapping_polygon(nil)
      assert {:error, :invalid_polygon} = Plot.Repo.list_plots_overlapping_polygon(%{})
    end

    test "excludes soft-deleted plots from spatial queries" do
      user = user_fixture()

      # Create a plot that overlaps with search area
      {:ok, plot} =
        Plot.Repo.create_plot(%{
          name: "To Be Deleted",
          description: "Plot that will be soft deleted",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{2, 2}, {2, 8}, {8, 8}, {8, 2}, {2, 2}]],
            srid: 4326
          }
        })

      search_polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 5}, {5, 5}, {5, 0}, {0, 0}]],
        srid: 4326
      }

      # Verify plot is found before deletion
      results_before = Plot.Repo.list_plots_overlapping_polygon(search_polygon)
      assert plot.id in Enum.map(results_before, & &1.id)

      # Soft delete the plot
      {:ok, _deleted_plot} = Plot.Repo.delete_plot(plot)

      # Verify plot is not found after soft deletion
      results_after = Plot.Repo.list_plots_overlapping_polygon(search_polygon)
      refute plot.id in Enum.map(results_after, & &1.id)
    end
  end

  describe "get_size/1" do
    test "calculates size of a simple square polygon" do
      # 10x10 square = 100 pixels
      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 100
    end

    test "calculates size of a rectangle polygon" do
      # 5x20 rectangle = 100 pixels
      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 5}, {20, 5}, {20, 0}, {0, 0}]],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 100
    end

    test "calculates size of a triangle polygon" do
      # Triangle with base 10 and height 10 = 50 pixels
      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {10, 0}, {5, 10}, {0, 0}]],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 50
    end

    test "calculates size of complex L-shaped polygon" do
      # L-shape: 10x10 square minus 5x5 square = 100 - 25 = 75 pixels
      polygon = %Geo.Polygon{
        coordinates: [[{0, 0}, {0, 10}, {5, 10}, {5, 5}, {10, 5}, {10, 0}, {0, 0}]],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 75
    end

    test "handles very small polygons" do
      # 0.1 x 0.1 square = 0.01 pixels, should round to 0
      polygon = %Geo.Polygon{
        coordinates: [[{0.0, 0.0}, {0.0, 0.1}, {0.1, 0.1}, {0.1, 0.0}, {0.0, 0.0}]],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 0
    end

    test "handles fractional areas that round up" do
      # 1.6 x 1.6 square = 2.56 pixels, should round to 3
      polygon = %Geo.Polygon{
        coordinates: [[{0.0, 0.0}, {0.0, 1.6}, {1.6, 1.6}, {1.6, 0.0}, {0.0, 0.0}]],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 3
    end

    test "returns 0 for nil polygon" do
      assert Plot.Repo.get_size(nil) == 0
    end

    test "returns 0 for invalid input" do
      assert Plot.Repo.get_size("not a polygon") == 0
      assert Plot.Repo.get_size(%{}) == 0
      assert Plot.Repo.get_size(123) == 0
    end

    test "handles polygon with holes (donut shape)" do
      # 10x10 square with 4x4 hole in center = 100 - 16 = 84 pixels
      polygon = %Geo.Polygon{
        coordinates: [
          # Outer ring
          [{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}],
          # Inner ring (hole) - note reverse winding
          [{3, 3}, {7, 3}, {7, 7}, {3, 7}, {3, 3}]
        ],
        srid: 4326
      }

      assert Plot.Repo.get_size(polygon) == 84
    end
  end
end
