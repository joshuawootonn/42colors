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
      {:ok, plot1} =
        Plot.Repo.create_plot(%{
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
      {:ok, plot2} =
        Plot.Repo.create_plot(%{
          name: "Distant Plot",
          description: "Plot far from center",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{340, 340}, {340, 360}, {360, 360}, {360, 340}, {340, 340}]],
            srid: 4326
          }
        })

      # Plot 3: Large plot that spans multiple chunks
      {:ok, plot3} =
        Plot.Repo.create_plot(%{
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
      {:ok, plot4} =
        Plot.Repo.create_plot(%{
          name: "Boundary Plot",
          description: "Plot at chunk boundary",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{398, 398}, {398, 400}, {400, 400}, {400, 398}, {398, 398}]],
            srid: 4326
          }
        })

      # Plot 5: No polygon (should never be returned)
      {:ok, plot5} =
        Plot.Repo.create_plot(%{
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
      # covers (100,100) to (500,500)
      results1 = Plot.Service.list_plots_by_chunk(100, 100)
      # covers (250,250) to (650,650)
      results2 = Plot.Service.list_plots_by_chunk(250, 250)
      # covers (400,400) to (800,800)
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
      {:ok, negative_plot} =
        Plot.Repo.create_plot(%{
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
      {:ok, origin_plot} =
        Plot.Repo.create_plot(%{
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
      {:ok, edge_plot} =
        Plot.Repo.create_plot(%{
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
      {:ok, outside_plot} =
        Plot.Repo.create_plot(%{
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
      {:ok, large_coord_plot} =
        Plot.Repo.create_plot(%{
          name: "Large Coord Plot",
          description: "Plot with large coordinates",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [
              [{10050, 10050}, {10050, 10060}, {10060, 10060}, {10060, 10050}, {10050, 10050}]
            ],
            srid: 4326
          }
        })

      # Search starting from (10000, 10000) - chunk covers (10000, 10000) to (10400, 10400)
      results = Plot.Service.list_plots_by_chunk(10000, 10000)
      result_ids = Enum.map(results, & &1.id)

      assert large_coord_plot.id in result_ids
    end
  end

  describe "list_plots/1" do
    setup do
      # Create multiple users
      user1 = user_fixture()
      user2 = user_fixture()
      user3 = user_fixture()

      # Create plots with different creation times to test sorting
      # We'll insert them in a specific order to test the sorting functionality

      # Oldest plot (created first)
      {:ok, oldest_plot} =
        Plot.Repo.create_plot(%{
          name: "Oldest Plot",
          description: "This is the oldest plot",
          user_id: user1.id,
          polygon: %Geo.Polygon{
            coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
            srid: 4326
          }
        })

      # Sleep to ensure different timestamps
      Process.sleep(10)

      # Middle plot
      {:ok, middle_plot} =
        Plot.Repo.create_plot(%{
          name: "Middle Plot",
          description: "This is a middle plot",
          user_id: user2.id,
          polygon: %Geo.Polygon{
            coordinates: [[{30, 30}, {30, 40}, {40, 40}, {40, 30}, {30, 30}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      # Newest plot (created last)
      {:ok, newest_plot} =
        Plot.Repo.create_plot(%{
          name: "Newest Plot",
          description: "This is the newest plot",
          user_id: user3.id,
          polygon: %Geo.Polygon{
            coordinates: [[{50, 50}, {50, 60}, {60, 60}, {60, 50}, {50, 50}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      # Plot without polygon (should still be included in search)
      {:ok, no_polygon_plot} =
        Plot.Repo.create_plot(%{
          name: "No Polygon Plot",
          description: "Plot without polygon",
          user_id: user1.id,
          polygon: nil
        })

      %{
        user1: user1,
        user2: user2,
        user3: user3,
        oldest_plot: oldest_plot,
        middle_plot: middle_plot,
        newest_plot: newest_plot,
        no_polygon_plot: no_polygon_plot
      }
    end

    test "returns all plots sorted by creation date (newest first) with default limit", %{
      oldest_plot: oldest_plot,
      middle_plot: middle_plot,
      newest_plot: newest_plot,
      no_polygon_plot: no_polygon_plot
    } do
      {results, has_more} = Plot.Service.list_plots(%{})

      # Should return all plots (4 total) since we're under the default limit of 20
      assert length(results) == 4
      assert has_more == false

      # Should be sorted by creation date (newest first)
      # Verify that each subsequent plot has an earlier or equal inserted_at timestamp
      timestamps = Enum.map(results, & &1.inserted_at)

      # Check that timestamps are in descending order (newest first)
      sorted_timestamps = Enum.sort(timestamps, {:desc, DateTime})
      assert timestamps == sorted_timestamps

      # Verify all our test plots are included
      result_ids = Enum.map(results, & &1.id) |> MapSet.new()

      expected_ids =
        [oldest_plot.id, middle_plot.id, newest_plot.id, no_polygon_plot.id] |> MapSet.new()

      assert MapSet.equal?(result_ids, expected_ids)
    end

    test "respects custom limit parameter", %{} do
      # Test limit of 2
      {results, has_more} = Plot.Service.list_plots(%{limit: 2})
      assert length(results) == 2
      assert has_more == true

      # Should return the 2 newest plots, with newest first
      timestamps = Enum.map(results, & &1.inserted_at)
      sorted_timestamps = Enum.sort(timestamps, {:desc, DateTime})
      assert timestamps == sorted_timestamps
    end

    test "enforces maximum limit of 100" do
      user = user_fixture()

      for i <- 1..150 do
        Plot.Repo.create_plot(%{
          name: "Bulk Plot #{i}",
          description: "Bulk created plot #{i}",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{i, i}, {i, i + 10}, {i + 10, i + 10}, {i + 10, i}, {i, i}]],
            srid: 4326
          }
        })

        # Small delay to ensure different timestamps
        Process.sleep(1)
      end

      # Test that requesting more than 100 plots still returns max 100
      {results, _has_more} = Plot.Service.list_plots(%{limit: 150})
      assert length(results) <= 100
    end

    test "handles limit of 0" do
      {results, has_more} = Plot.Service.list_plots(%{limit: 0})
      assert results == []
      assert has_more == false
    end

    test "handles negative limit by using default" do
      {results, _has_more} = Plot.Service.list_plots(%{limit: -5})

      # Should fall back to default behavior (return all plots up to default limit)
      assert length(results) == 4
    end

    test "returns plots from all users (global search)", %{
      user1: user1,
      user2: user2,
      user3: user3
    } do
      {results, _has_more} = Plot.Service.list_plots(%{})

      # Should include plots from all users
      user_ids = results |> Enum.map(& &1.user_id) |> Enum.uniq() |> Enum.sort()
      expected_user_ids = [user1.id, user2.id, user3.id] |> Enum.sort()
      assert user_ids == expected_user_ids
    end

    test "includes plots with and without polygons" do
      {results, _has_more} = Plot.Service.list_plots(%{})

      # Should include both plots with polygons and without
      plots_with_polygon = Enum.filter(results, &(&1.polygon != nil))
      plots_without_polygon = Enum.filter(results, &(&1.polygon == nil))

      assert length(plots_with_polygon) == 3
      assert length(plots_without_polygon) == 1
    end

    test "returns empty list when no plots exist" do
      # Delete all plots
      Api.Repo.delete_all(Plot)

      {results, has_more} = Plot.Service.list_plots(%{})
      assert results == []
      assert has_more == false
    end

    test "handles large dataset efficiently" do
      # Create many plots to test performance and limits
      user = user_fixture()

      # Create 25 additional plots (more than default limit of 20)
      for i <- 1..25 do
        Plot.Repo.create_plot(%{
          name: "Bulk Plot #{i}",
          description: "Bulk created plot #{i}",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{i, i}, {i, i + 10}, {i + 10, i + 10}, {i + 10, i}, {i, i}]],
            srid: 4326
          }
        })

        # Small delay to ensure different timestamps
        Process.sleep(1)
      end

      # Test default limit (should return 20 most recent)
      {results_default, has_more_default} = Plot.Service.list_plots(%{})
      assert length(results_default) == 20
      assert has_more_default == true

      # Test custom limit within max
      {results_custom, _has_more} = Plot.Service.list_plots(%{limit: 15})
      assert length(results_custom) == 15

      # Test that results are properly sorted (newest first)
      # Since we created 25 bulk plots after the 4 setup plots,
      # the bulk plots should be among the most recent
      bulk_plots_in_results =
        Enum.count(results_default, fn plot ->
          String.contains?(plot.name, "Bulk Plot")
        end)

      # We should have some bulk plots in the top 20 results
      assert bulk_plots_in_results > 0
    end

    test "returns plots sorted by score when order_by is 'top'" do
      user = user_fixture()

      # Create plots with different scores
      {:ok, low_score_plot} =
        Plot.Repo.create_plot(%{
          name: "Low Score Plot",
          description: "Low score",
          user_id: user.id,
          score: 5,
          polygon: %Geo.Polygon{
            coordinates: [[{100, 100}, {100, 110}, {110, 110}, {110, 100}, {100, 100}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      {:ok, high_score_plot} =
        Plot.Repo.create_plot(%{
          name: "High Score Plot",
          description: "High score",
          user_id: user.id,
          score: 100,
          polygon: %Geo.Polygon{
            coordinates: [[{200, 200}, {200, 210}, {210, 210}, {210, 200}, {200, 200}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      {:ok, medium_score_plot} =
        Plot.Repo.create_plot(%{
          name: "Medium Score Plot",
          description: "Medium score",
          user_id: user.id,
          score: 50,
          polygon: %Geo.Polygon{
            coordinates: [[{300, 300}, {300, 310}, {310, 310}, {310, 300}, {300, 300}]],
            srid: 4326
          }
        })

      # Get plots sorted by score (top)
      {results, _has_more} = Plot.Service.list_plots(%{order_by: "top"})

      # Find positions of our test plots
      result_ids = Enum.map(results, & &1.id)
      high_pos = Enum.find_index(result_ids, &(&1 == high_score_plot.id))
      medium_pos = Enum.find_index(result_ids, &(&1 == medium_score_plot.id))
      low_pos = Enum.find_index(result_ids, &(&1 == low_score_plot.id))

      # High score should come before medium, medium before low
      assert high_pos < medium_pos
      assert medium_pos < low_pos
    end

    test "groups plots with equal scores together with order_by 'top'" do
      user = user_fixture()

      {:ok, first_plot} =
        Plot.Repo.create_plot(%{
          name: "First Same Score",
          description: "Same score first",
          user_id: user.id,
          score: 42,
          polygon: %Geo.Polygon{
            coordinates: [[{400, 400}, {400, 410}, {410, 410}, {410, 400}, {400, 400}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      {:ok, second_plot} =
        Plot.Repo.create_plot(%{
          name: "Second Same Score",
          description: "Same score second",
          user_id: user.id,
          score: 42,
          polygon: %Geo.Polygon{
            coordinates: [[{500, 500}, {500, 510}, {510, 510}, {510, 500}, {500, 500}]],
            srid: 4326
          }
        })

      {results, _has_more} = Plot.Service.list_plots(%{order_by: "top"})

      result_ids = Enum.map(results, & &1.id)
      first_pos = Enum.find_index(result_ids, &(&1 == first_plot.id))
      second_pos = Enum.find_index(result_ids, &(&1 == second_plot.id))

      # Both plots with score 42 should come before the setup plots with score 0
      # They should be in the first two positions
      assert first_pos in [0, 1]
      assert second_pos in [0, 1]

      # Both should be adjacent (grouped by same score)
      assert abs(first_pos - second_pos) == 1
    end

    test "order_by 'recent' returns same result as default (no order_by)" do
      {results_default, _has_more1} = Plot.Service.list_plots(%{})
      {results_recent, _has_more2} = Plot.Service.list_plots(%{order_by: "recent"})

      # Should return same plots in same order
      default_ids = Enum.map(results_default, & &1.id)
      recent_ids = Enum.map(results_recent, & &1.id)

      assert default_ids == recent_ids
    end

    test "order_by 'top' respects limit parameter" do
      user = user_fixture()

      for i <- 1..5 do
        Plot.Repo.create_plot(%{
          name: "Score Plot #{i}",
          description: "Score plot",
          user_id: user.id,
          score: i * 10,
          polygon: %Geo.Polygon{
            coordinates: [
              [
                {i * 100, i * 100},
                {i * 100, i * 100 + 10},
                {i * 100 + 10, i * 100 + 10},
                {i * 100 + 10, i * 100},
                {i * 100, i * 100}
              ]
            ],
            srid: 4326
          }
        })
      end

      {results, _has_more} = Plot.Service.list_plots(%{order_by: "top", limit: 3})

      # Should only return 3 plots
      assert length(results) == 3

      # First 3 should be highest scores (50, 40, 30)
      scores = Enum.map(results, & &1.score)
      assert Enum.at(scores, 0) >= Enum.at(scores, 1)
      assert Enum.at(scores, 1) >= Enum.at(scores, 2)
    end

    test "paginates with starting_after cursor for recent ordering" do
      user = user_fixture()

      # Create 10 plots
      plots =
        for i <- 1..10 do
          {:ok, plot} =
            Plot.Repo.create_plot(%{
              name: "Pagination Plot #{i}",
              description: "Pagination test",
              user_id: user.id,
              polygon: %Geo.Polygon{
                coordinates: [
                  [
                    {i * 100, i * 100},
                    {i * 100, i * 100 + 10},
                    {i * 100 + 10, i * 100 + 10},
                    {i * 100 + 10, i * 100},
                    {i * 100, i * 100}
                  ]
                ],
                srid: 4326
              }
            })

          Process.sleep(5)
          plot
        end

      # Get first page
      {first_page, has_more1} = Plot.Service.list_plots(%{limit: 5})
      assert length(first_page) == 5
      assert has_more1 == true

      # Get second page using cursor
      last_id = List.last(first_page).id
      {second_page, has_more2} = Plot.Service.list_plots(%{limit: 5, starting_after: last_id})
      assert length(second_page) == 5
      assert has_more2 == true  # 4 setup plots still exist

      # Verify no overlap
      first_page_ids = Enum.map(first_page, & &1.id)
      second_page_ids = Enum.map(second_page, & &1.id)
      assert Enum.all?(second_page_ids, fn id -> id not in first_page_ids end)
    end

    test "paginates with starting_after cursor for top ordering" do
      user = user_fixture()

      # Create 10 plots with different scores
      for i <- 1..10 do
        Plot.Repo.create_plot(%{
          name: "Top Pagination Plot #{i}",
          description: "Top pagination test",
          user_id: user.id,
          score: i * 10,
          polygon: %Geo.Polygon{
            coordinates: [
              [
                {i * 100, i * 100},
                {i * 100, i * 100 + 10},
                {i * 100 + 10, i * 100 + 10},
                {i * 100 + 10, i * 100},
                {i * 100, i * 100}
              ]
            ],
            srid: 4326
          }
        })
      end

      # Get first page sorted by top
      {first_page, has_more1} = Plot.Service.list_plots(%{limit: 5, order_by: "top"})
      assert length(first_page) == 5
      assert has_more1 == true

      # Verify first page has highest scores
      first_page_scores = Enum.map(first_page, & &1.score)
      assert first_page_scores == Enum.sort(first_page_scores, :desc)

      # Get second page using cursor
      last_id = List.last(first_page).id
      {second_page, _has_more2} = Plot.Service.list_plots(%{limit: 5, order_by: "top", starting_after: last_id})

      # Verify second page scores are lower than first page
      second_page_scores = Enum.map(second_page, & &1.score)
      first_page_min_score = Enum.min(first_page_scores)
      second_page_max_score = Enum.max(second_page_scores)
      assert first_page_min_score >= second_page_max_score
    end

    test "returns empty list for invalid cursor" do
      {results, has_more} = Plot.Service.list_plots(%{starting_after: 999999})
      assert results == []
      assert has_more == false
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
      {:ok, existing_plot} =
        Plot.Repo.create_plot(%{
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

      assert {:error, :overlapping_plots, overlapping_plots} =
               Plot.Service.create_plot(overlapping_attrs)

      assert length(overlapping_plots) == 1
      assert List.first(overlapping_plots).id == existing_plot.id
    end

    test "returns changeset error when plot attributes are invalid" do
      plot_attrs = %{
        # Invalid: empty name
        name: "",
        # Invalid: nil user_id
        user_id: nil,
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
      {:ok, _existing_plot} =
        Plot.Repo.create_plot(%{
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

      {:ok, plot} =
        Plot.Repo.create_plot(%{
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

      {:ok, plot} =
        Plot.Repo.create_plot(%{
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
      {:ok, existing_plot} =
        Plot.Repo.create_plot(%{
          name: "Existing Plot",
          description: "An existing plot",
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{30, 30}, {30, 50}, {50, 50}, {50, 30}, {30, 30}]],
            srid: 4326
          }
        })

      # Create second plot to update
      {:ok, plot_to_update} =
        Plot.Repo.create_plot(%{
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

      assert {:error, :overlapping_plots, overlapping_plots} =
               Plot.Service.update_plot(plot_to_update, update_attrs)

      assert length(overlapping_plots) == 1
      assert List.first(overlapping_plots).id == existing_plot.id
    end

    test "allows plot to be updated with same polygon (no self-overlap)" do
      user = user_fixture()

      polygon = %Geo.Polygon{
        coordinates: [[{10, 10}, {10, 20}, {20, 20}, {20, 10}, {10, 10}]],
        srid: 4326
      }

      {:ok, plot} =
        Plot.Repo.create_plot(%{
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

      {:ok, plot} =
        Plot.Repo.create_plot(%{
          name: "Original Plot",
          description: "Original description",
          user_id: user.id
        })

      update_attrs = %{
        # Invalid: empty name
        name: ""
      }

      assert {:error, %Ecto.Changeset{}} = Plot.Service.update_plot(plot, update_attrs)
    end

    test "updates plot successfully when no polygon is provided in update" do
      user = user_fixture()

      {:ok, plot} =
        Plot.Repo.create_plot(%{
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
