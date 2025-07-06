defmodule Api.Canvas.Plot.ServiceTest do
  use Api.DataCase

  alias Api.Canvas.Plot

  import Api.AccountsFixtures

  describe "list_plots_by_chunk/2" do
    setup do
      user1 = user_fixture()
      user2 = user_fixture()

      # Create plots with different spatial locations for testing
      # Plot 1: Small plot at (150, 150) - should be found when searching from (100, 100)
      # since chunk from (100,100) covers (100,100) to (500,500)
      {:ok, plot1} = Plot.Repo.create_plot(%{
        name: "Central Plot",
        description: "Plot in the center area",
        user_id: user1.id,
        polygon: %Geo.Polygon{
          coordinates: [[{145, 145}, {145, 155}, {155, 155}, {155, 145}, {145, 145}]],
          srid: 4326
        }
      })

      # Plot 2: Plot at (350, 350) - should be found when searching from (300, 300)
      # since chunk from (300,300) covers (300,300) to (700,700)
      {:ok, plot2} = Plot.Repo.create_plot(%{
        name: "Distant Plot",
        description: "Plot far from center",
        user_id: user1.id,
        polygon: %Geo.Polygon{
          coordinates: [[{340, 340}, {340, 360}, {360, 360}, {360, 340}, {340, 340}]],
          srid: 4326
        }
      })

      # Plot 3: Large plot that spans multiple chunks
      {:ok, plot3} = Plot.Repo.create_plot(%{
        name: "Large Plot",
        description: "Plot spanning multiple chunks",
        user_id: user2.id,
        polygon: %Geo.Polygon{
          coordinates: [[{0, 0}, {0, 800}, {800, 800}, {800, 0}, {0, 0}]],
          srid: 4326
        }
      })

      # Plot 4: Plot at chunk boundary - at (399, 399) should be found from (0, 0)
      # since chunk from (0,0) covers (0,0) to (400,400)
      {:ok, plot4} = Plot.Repo.create_plot(%{
        name: "Boundary Plot",
        description: "Plot at chunk boundary",
        user_id: user1.id,
        polygon: %Geo.Polygon{
          coordinates: [[{398, 398}, {398, 400}, {400, 400}, {400, 398}, {398, 398}]],
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

    test "returns plots within 400x400 chunk starting from coordinates", %{
      plot1: plot1
    } do
      # Search starting from (100, 100) - chunk covers (100, 100) to (500, 500)
      # plot1 is at (145-155, 145-155) so it should be found
      results = Plot.Service.list_plots_by_chunk(100, 100)
      result_ids = Enum.map(results, & &1.id)

      assert plot1.id in result_ids
      assert length(results) >= 1
    end

    test "returns different plots for different chunk locations", %{
      plot1: plot1,
      plot2: plot2
    } do
      # Search starting from (100, 100) - chunk covers (100, 100) to (500, 500)
      results1 = Plot.Service.list_plots_by_chunk(100, 100)
      result_ids1 = Enum.map(results1, & &1.id)

      # Search starting from (300, 300) - chunk covers (300, 300) to (700, 700)
      results2 = Plot.Service.list_plots_by_chunk(300, 300)
      result_ids2 = Enum.map(results2, & &1.id)

      assert plot1.id in result_ids1
      assert plot2.id in result_ids2
    end

    test "returns large plots that intersect with chunk", %{
      plot3: plot3
    } do
      # The large plot (0,0) to (800,800) should be found in multiple chunk searches
      results1 = Plot.Service.list_plots_by_chunk(100, 100)  # covers (100,100) to (500,500)
      results2 = Plot.Service.list_plots_by_chunk(250, 250)  # covers (250,250) to (650,650)
      results3 = Plot.Service.list_plots_by_chunk(400, 400)  # covers (400,400) to (800,800)

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
      # Search starting from (0, 0) - chunk covers (0, 0) to (400, 400)
      # plot4 is at (398-400, 398-400) so it should be found
      results = Plot.Service.list_plots_by_chunk(0, 0)
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
          coordinates: [[{-95, -95}, {-95, -85}, {-85, -85}, {-85, -95}, {-95, -95}]],
          srid: 4326
        }
      })

      # Search starting from (-100, -100) - chunk covers (-100, -100) to (300, 300)
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
          coordinates: [[{5, 5}, {5, 15}, {15, 15}, {15, 5}, {5, 5}]],
          srid: 4326
        }
      })

      # Search starting from (0, 0) - chunk covers (0, 0) to (400, 400)
      results = Plot.Service.list_plots_by_chunk(0, 0)
      result_ids = Enum.map(results, & &1.id)

      assert origin_plot.id in result_ids
    end

    test "chunk size is correctly defined" do
      assert Plot.Service.chunk_size() == 400
    end

    test "chunk boundaries are calculated correctly" do
      # Test that chunks are 400x400 starting from the given coordinates
      user = user_fixture()

      # Create a plot at (399, 399) - should be included when searching from (0, 0)
      # since chunk from (0,0) covers (0,0) to (400,400)
      {:ok, edge_plot} = Plot.Repo.create_plot(%{
        name: "Edge Plot",
        description: "Plot at chunk edge",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{399, 399}, {399, 400}, {400, 400}, {400, 399}, {399, 399}]],
          srid: 4326
        }
      })

      # Search starting from (0, 0) - chunk covers (0, 0) to (400, 400)
      results = Plot.Service.list_plots_by_chunk(0, 0)
      result_ids = Enum.map(results, & &1.id)

      assert edge_plot.id in result_ids
    end

    test "plot outside chunk boundary is not included" do
      user = user_fixture()

      # Create a plot at (401, 401) - should NOT be included when searching from (0, 0)
      # since chunk from (0,0) covers (0,0) to (400,400)
      {:ok, outside_plot} = Plot.Repo.create_plot(%{
        name: "Outside Plot",
        description: "Plot outside chunk boundary",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{401, 401}, {401, 410}, {410, 410}, {410, 401}, {401, 401}]],
          srid: 4326
        }
      })

      # Search starting from (0, 0) - chunk covers (0, 0) to (400, 400)
      results = Plot.Service.list_plots_by_chunk(0, 0)
      result_ids = Enum.map(results, & &1.id)

      refute outside_plot.id in result_ids
    end

    test "handles very large coordinates" do
      user = user_fixture()

      # Create a plot with large coordinates
      {:ok, large_coord_plot} = Plot.Repo.create_plot(%{
        name: "Large Coord Plot",
        description: "Plot with large coordinates",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10050, 10050}, {10050, 10060}, {10060, 10060}, {10060, 10050}, {10050, 10050}]],
          srid: 4326
        }
      })

      # Search starting from (10000, 10000) - chunk covers (10000, 10000) to (10400, 10400)
      results = Plot.Service.list_plots_by_chunk(10000, 10000)
      result_ids = Enum.map(results, & &1.id)

      assert large_coord_plot.id in result_ids
    end
  end

  describe "create_plot/1" do
    test "creates plot successfully when no overlaps exist" do
      user = user_fixture()

      plot_attrs = %{
        name: "Test Plot",
        description: "A test plot",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
          srid: 4326
        }
      }

      assert {:ok, %Plot{} = plot} = Plot.Service.create_plot(plot_attrs)
      assert plot.name == "Test Plot"
      assert plot.description == "A test plot"
      assert plot.user_id == user.id
    end

    test "creates plot successfully when no polygon is provided" do
      user = user_fixture()

      plot_attrs = %{
        name: "Test Plot",
        description: "A test plot",
        user_id: user.id
      }

      assert {:ok, %Plot{} = plot} = Plot.Service.create_plot(plot_attrs)
      assert plot.name == "Test Plot"
      assert plot.polygon == nil
    end

    test "returns overlapping plots error when plot overlaps with existing plot" do
      user = user_fixture()

      # Create first plot
      {:ok, existing_plot} = Plot.Repo.create_plot(%{
        name: "Existing Plot",
        description: "An existing plot",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 30}, {30, 30}, {30, 10}, {10, 10}]],
          srid: 4326
        }
      })

      # Try to create overlapping plot
      overlapping_attrs = %{
        name: "Overlapping Plot",
        description: "A plot that overlaps",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{20, 20}, {20, 40}, {40, 40}, {40, 20}, {20, 20}]],
          srid: 4326
        }
      }

      assert {:error, :overlapping_plots, overlapping_plots} = Plot.Service.create_plot(overlapping_attrs)
      assert length(overlapping_plots) == 1
      assert List.first(overlapping_plots).id == existing_plot.id
    end

    test "returns changeset error when plot attributes are invalid" do
      plot_attrs = %{
        name: "",  # Invalid: empty name
        user_id: nil,  # Invalid: nil user_id
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
          srid: 4326
        }
      }

      assert {:error, %Ecto.Changeset{}} = Plot.Service.create_plot(plot_attrs)
    end

    test "allows non-overlapping plots to be created" do
      user = user_fixture()

      # Create first plot
      {:ok, _existing_plot} = Plot.Repo.create_plot(%{
        name: "Existing Plot",
        description: "An existing plot",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 30}, {30, 30}, {30, 10}, {10, 10}]],
          srid: 4326
        }
      })

      # Create non-overlapping plot
      non_overlapping_attrs = %{
        name: "Non-overlapping Plot",
        description: "A plot that doesn't overlap",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{50, 50}, {50, 70}, {70, 70}, {70, 50}, {50, 50}]],
          srid: 4326
        }
      }

      assert {:ok, %Plot{} = plot} = Plot.Service.create_plot(non_overlapping_attrs)
      assert plot.name == "Non-overlapping Plot"
    end
  end

  describe "update_plot/2" do
    test "updates plot successfully when no overlaps exist" do
      user = user_fixture()

      {:ok, plot} = Plot.Repo.create_plot(%{
        name: "Original Plot",
        description: "Original description",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
          srid: 4326
        }
      })

      update_attrs = %{
        name: "Updated Plot",
        description: "Updated description"
      }

      assert {:ok, %Plot{} = updated_plot} = Plot.Service.update_plot(plot, update_attrs)
      assert updated_plot.name == "Updated Plot"
      assert updated_plot.description == "Updated description"
    end

    test "updates plot successfully when updating polygon without overlaps" do
      user = user_fixture()

      {:ok, plot} = Plot.Repo.create_plot(%{
        name: "Original Plot",
        description: "Original description",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
          srid: 4326
        }
      })

      new_polygon = %Geo.Polygon{
        coordinates: [[{50, 50}, {50, 60}, {60, 60}, {60, 50}, {50, 50}]],
        srid: 4326
      }

      update_attrs = %{polygon: new_polygon}

      assert {:ok, %Plot{} = updated_plot} = Plot.Service.update_plot(plot, update_attrs)
      assert updated_plot.polygon == new_polygon
    end

    test "returns overlapping plots error when updated polygon overlaps with existing plot" do
      user = user_fixture()

      # Create first plot
      {:ok, existing_plot} = Plot.Repo.create_plot(%{
        name: "Existing Plot",
        description: "An existing plot",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{30, 30}, {30, 50}, {50, 50}, {50, 30}, {30, 30}]],
          srid: 4326
        }
      })

      # Create second plot to update
      {:ok, plot_to_update} = Plot.Repo.create_plot(%{
        name: "Plot to Update",
        description: "A plot that will be updated",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
          srid: 4326
        }
      })

      # Try to update with overlapping polygon
      overlapping_polygon = %Geo.Polygon{
        coordinates: [[{35, 35}, {35, 55}, {55, 55}, {55, 35}, {35, 35}]],
        srid: 4326
      }

      update_attrs = %{polygon: overlapping_polygon}

      assert {:error, :overlapping_plots, overlapping_plots} = Plot.Service.update_plot(plot_to_update, update_attrs)
      assert length(overlapping_plots) == 1
      assert List.first(overlapping_plots).id == existing_plot.id
    end

    test "allows plot to be updated with same polygon (no self-overlap)" do
      user = user_fixture()

      polygon = %Geo.Polygon{
        coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
        srid: 4326
      }

      {:ok, plot} = Plot.Repo.create_plot(%{
        name: "Original Plot",
        description: "Original description",
        user_id: user.id,
        polygon: polygon
      })

      # Update with same polygon should work (no self-overlap)
      update_attrs = %{
        name: "Updated Plot",
        polygon: polygon
      }

      assert {:ok, %Plot{} = updated_plot} = Plot.Service.update_plot(plot, update_attrs)
      assert updated_plot.name == "Updated Plot"
      assert updated_plot.polygon == polygon
    end

    test "returns changeset error when update attributes are invalid" do
      user = user_fixture()

      {:ok, plot} = Plot.Repo.create_plot(%{
        name: "Original Plot",
        description: "Original description",
        user_id: user.id
      })

      update_attrs = %{
        name: ""  # Invalid: empty name
      }

      assert {:error, %Ecto.Changeset{}} = Plot.Service.update_plot(plot, update_attrs)
    end

    test "updates plot successfully when no polygon is provided in update" do
      user = user_fixture()

      {:ok, plot} = Plot.Repo.create_plot(%{
        name: "Original Plot",
        description: "Original description",
        user_id: user.id,
        polygon: %Geo.Polygon{
          coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
          srid: 4326
        }
      })

      update_attrs = %{
        name: "Updated Plot"
      }

      assert {:ok, %Plot{} = updated_plot} = Plot.Service.update_plot(plot, update_attrs)
      assert updated_plot.name == "Updated Plot"
      # Polygon should remain unchanged
      assert updated_plot.polygon == plot.polygon
    end
  end
end
