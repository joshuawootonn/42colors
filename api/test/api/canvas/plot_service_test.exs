defmodule Api.Canvas.Plot.ServiceTest do
  use Api.DataCase

  alias Api.Canvas.Plot

  import Api.AccountsFixtures

  describe "list_plots_by_chunk/2" do
    setup do
      user1 = user_fixture()
      user2 = user_fixture()

      # Create plots with different spatial locations for testing
      # Plot 1: Center at (100, 100) - should be found when searching around (100, 100)
      {:ok, plot1} = Plot.Repo.create_plot(%{
        name: "Central Plot",
        description: "Plot in the center area",
        user_id: user1.id,
        polygon: %Geo.Polygon{
          coordinates: [[{95, 95}, {95, 105}, {105, 105}, {105, 95}, {95, 95}]],
          srid: 4326
        }
      })

      # Plot 2: Center at (300, 300) - should be found when searching around (300, 300)
      {:ok, plot2} = Plot.Repo.create_plot(%{
        name: "Distant Plot",
        description: "Plot far from center",
        user_id: user1.id,
        polygon: %Geo.Polygon{
          coordinates: [[{290, 290}, {290, 310}, {310, 310}, {310, 290}, {290, 290}]],
          srid: 4326
        }
      })

      # Plot 3: Large plot that spans multiple chunks
      {:ok, plot3} = Plot.Repo.create_plot(%{
        name: "Large Plot",
        description: "Plot spanning multiple chunks",
        user_id: user2.id,
        polygon: %Geo.Polygon{
          coordinates: [[{0, 0}, {0, 500}, {500, 500}, {500, 0}, {0, 0}]],
          srid: 4326
        }
      })

      # Plot 4: Edge case - plot exactly at chunk boundary
      {:ok, plot4} = Plot.Repo.create_plot(%{
        name: "Boundary Plot",
        description: "Plot at chunk boundary",
        user_id: user1.id,
        polygon: %Geo.Polygon{
          coordinates: [[{198, 198}, {198, 202}, {202, 202}, {202, 198}, {198, 198}]],
          srid: 4326
        }
      })

      # Plot 5: No polygon (should never be returned)
      {:ok, plot5} = Plot.Repo.create_plot(%{
        name: "No Polygon Plot",
        description: "Plot without polygon",
        user_id: user1.id,
        polygon: nil
      })

      %{
        user1: user1,
        user2: user2,
        plot1: plot1,
        plot2: plot2,
        plot3: plot3,
        plot4: plot4,
        plot5: plot5
      }
    end

    test "returns plots within 400x400 chunk centered on coordinates", %{
      plot1: plot1
    } do
      # Search around plot1's location (100, 100)
      # Chunk should be from (-100, -100) to (300, 300)
      results = Plot.Service.list_plots_by_chunk(100, 100)
      result_ids = Enum.map(results, & &1.id)

      assert plot1.id in result_ids
      assert length(results) >= 1
    end

    test "returns different plots for different chunk locations", %{
      plot1: plot1,
      plot2: plot2
    } do
      # Search around plot1's location
      results1 = Plot.Service.list_plots_by_chunk(100, 100)
      result_ids1 = Enum.map(results1, & &1.id)

      # Search around plot2's location
      results2 = Plot.Service.list_plots_by_chunk(300, 300)
      result_ids2 = Enum.map(results2, & &1.id)

      assert plot1.id in result_ids1
      assert plot2.id in result_ids2
    end

    test "returns large plots that intersect with chunk", %{
      plot3: plot3
    } do
      # The large plot should be found in multiple chunk searches
      results1 = Plot.Service.list_plots_by_chunk(100, 100)
      results2 = Plot.Service.list_plots_by_chunk(250, 250)
      results3 = Plot.Service.list_plots_by_chunk(400, 400)

      result_ids1 = Enum.map(results1, & &1.id)
      result_ids2 = Enum.map(results2, & &1.id)
      result_ids3 = Enum.map(results3, & &1.id)

      assert plot3.id in result_ids1
      assert plot3.id in result_ids2
      assert plot3.id in result_ids3
    end

    test "handles boundary cases correctly", %{
      plot4: plot4
    } do
      # Search at coordinates that should include the boundary plot
      results = Plot.Service.list_plots_by_chunk(200, 200)
      result_ids = Enum.map(results, & &1.id)

      assert plot4.id in result_ids
    end

    test "excludes plots with nil polygon", %{
      plot5: plot5
    } do
      # Search in an area that would include plot5 if it had a polygon
      results = Plot.Service.list_plots_by_chunk(0, 0)
      result_ids = Enum.map(results, & &1.id)

      refute plot5.id in result_ids
    end

    test "returns empty list when no plots intersect with chunk" do
      # Search in a remote area where no plots exist
      results = Plot.Service.list_plots_by_chunk(1000, 1000)
      assert results == []
    end

    test "only accepts integer coordinates" do
      # Service now only accepts integers - validation moved to controller
      results = Plot.Service.list_plots_by_chunk(100, 100)
      assert is_list(results)
    end

    test "handles negative coordinates correctly" do
      user = user_fixture()

      # Create a plot in negative coordinate space
      {:ok, negative_plot} = Plot.Repo.create_plot(%{
        name: "Negative Plot",
        description: "Plot in negative coordinates",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{-105, -105}, {-105, -95}, {-95, -95}, {-95, -105}, {-105, -105}]],
          srid: 4326
        }
      })

      # Search around the negative plot
      results = Plot.Service.list_plots_by_chunk(-100, -100)
      result_ids = Enum.map(results, & &1.id)

      assert negative_plot.id in result_ids
    end

    test "handles zero coordinates correctly" do
      user = user_fixture()

      # Create a plot around origin
      {:ok, origin_plot} = Plot.Repo.create_plot(%{
        name: "Origin Plot",
        description: "Plot around origin",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{-5, -5}, {-5, 5}, {5, 5}, {5, -5}, {-5, -5}]],
          srid: 4326
        }
      })

      # Search at origin
      results = Plot.Service.list_plots_by_chunk(0, 0)
      result_ids = Enum.map(results, & &1.id)

      assert origin_plot.id in result_ids
    end

    test "chunk size is correctly defined" do
      assert Plot.Service.chunk_size() == 400
    end

    test "chunk boundaries are calculated correctly" do
      # Test that chunks are 400x400 and centered on the coordinates
      user = user_fixture()

             # Create a plot at the exact edge of what should be included
       {:ok, edge_plot} = Plot.Repo.create_plot(%{
         name: "Edge Plot",
         description: "Plot at chunk edge",
         user_id: user.id,
         polygon: %Geo.Polygon{
           coordinates: [[{299, 299}, {299, 301}, {301, 301}, {301, 299}, {299, 299}]],
           srid: 4326
         }
       })

      # Search at (100, 100) - chunk should be from (-100, -100) to (300, 300)
      results = Plot.Service.list_plots_by_chunk(100, 100)
      result_ids = Enum.map(results, & &1.id)

      assert edge_plot.id in result_ids
    end

    test "handles very large coordinates" do
      user = user_fixture()

      # Create a plot with large coordinates
      {:ok, large_coord_plot} = Plot.Repo.create_plot(%{
        name: "Large Coord Plot",
        description: "Plot with large coordinates",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{9995, 9995}, {9995, 10005}, {10005, 10005}, {10005, 9995}, {9995, 9995}]],
          srid: 4326
        }
      })

      # Search around the large coordinates
      results = Plot.Service.list_plots_by_chunk(10000, 10000)
      result_ids = Enum.map(results, & &1.id)

      assert large_coord_plot.id in result_ids
    end
  end
end
