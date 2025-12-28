defmodule ApiWeb.ProfileControllerTest do
  use ApiWeb.ConnCase

  import Api.AccountsFixtures
  import Api.CanvasFixtures

  describe "show" do
    test "returns user profile without plots", %{conn: conn} do
      user = user_fixture()

      # Create some plots for the user (they shouldn't be in the profile response)
      _plot1 =
        plot_fixture(%{
          user_id: user.id,
          name: "First Plot",
          description: "First description"
        })

      conn = get(conn, ~p"/api/profile/#{user.id}")
      response = json_response(conn, 200)["data"]

      assert response["id"] == user.id
      assert response["username"] == user.username
      assert response["insertedAt"] != nil

      # Plots should not be included in profile endpoint
      refute Map.has_key?(response, "plots")
    end

    test "returns 404 when user does not exist", %{conn: conn} do
      conn = get(conn, ~p"/api/profile/999999")
      response = json_response(conn, 404)

      assert response["error"] == "User not found"
    end

    test "returns 400 when user ID is not an integer", %{conn: conn} do
      conn = get(conn, ~p"/api/profile/abc")
      response = json_response(conn, 400)

      assert response["error"] == "Invalid user ID"
    end

    test "returns 400 when user ID is a float string", %{conn: conn} do
      conn = get(conn, ~p"/api/profile/123.456")
      response = json_response(conn, 400)

      assert response["error"] == "Invalid user ID"
    end

    test "returns 400 when user ID contains non-numeric characters", %{conn: conn} do
      conn = get(conn, ~p"/api/profile/123abc")
      response = json_response(conn, 400)

      assert response["error"] == "Invalid user ID"
    end

    test "works with negative user IDs (edge case)", %{conn: conn} do
      # Negative IDs shouldn't exist but should return 404, not 400
      conn = get(conn, ~p"/api/profile/-1")
      response = json_response(conn, 404)

      assert response["error"] == "User not found"
    end

    test "returns correct user data structure", %{conn: conn} do
      user = user_fixture()

      conn = get(conn, ~p"/api/profile/#{user.id}")
      response = json_response(conn, 200)["data"]

      # Verify all expected fields are present
      assert Map.has_key?(response, "id")
      assert Map.has_key?(response, "username")
      assert Map.has_key?(response, "insertedAt")

      # Verify data types
      assert is_integer(response["id"])
      assert is_binary(response["username"]) or is_nil(response["username"])
      assert is_binary(response["insertedAt"])
    end

    test "does not require authentication", %{conn: conn} do
      user = user_fixture()

      # Make request without authentication
      conn = get(conn, ~p"/api/profile/#{user.id}")
      response = json_response(conn, 200)["data"]

      assert response["id"] == user.id
    end

    test "handles user ID at boundary (large integer)", %{conn: conn} do
      # Test with a very large integer that doesn't exist
      # Max 32-bit integer
      large_id = 2_147_483_647

      conn = get(conn, ~p"/api/profile/#{large_id}")
      response = json_response(conn, 404)

      assert response["error"] == "User not found"
    end

    test "handles concurrent requests for the same user", %{conn: _conn} do
      user = user_fixture()

      # Make multiple concurrent requests
      tasks =
        for _ <- 1..5 do
          Task.async(fn ->
            conn = build_conn()
            get(conn, ~p"/api/profile/#{user.id}")
          end)
        end

      results = Task.await_many(tasks)

      # All requests should succeed
      Enum.each(results, fn conn ->
        response = json_response(conn, 200)["data"]
        assert response["id"] == user.id
      end)
    end
  end

  describe "show_plots" do
    test "returns user's plots", %{conn: conn} do
      user = user_fixture()

      # Create some plots for the user
      plot1 =
        plot_fixture(%{
          user_id: user.id,
          name: "First Plot",
          description: "First description",
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
            srid: 4326
          }
        })

      plot2 =
        plot_fixture(%{
          user_id: user.id,
          name: "Second Plot",
          description: "Second description",
          polygon: %Geo.Polygon{
            coordinates: [[{20, 20}, {20, 30}, {30, 30}, {30, 20}, {20, 20}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      assert length(response) == 2

      plot_ids = Enum.map(response, & &1["id"])
      assert plot1.id in plot_ids
      assert plot2.id in plot_ids

      # Check plot data structure
      first_plot = Enum.find(response, &(&1["id"] == plot1.id))
      assert first_plot["name"] == "First Plot"
      assert first_plot["description"] == "First description"
      assert first_plot["polygon"] != nil
      assert first_plot["polygon"]["vertices"] == [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
      assert first_plot["score"] != nil
      assert first_plot["insertedAt"] != nil
      assert first_plot["updatedAt"] != nil
    end

    test "returns empty list when user has no plots", %{conn: conn} do
      user = user_fixture()

      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      assert response == []
    end

    test "returns 404 when user does not exist", %{conn: conn} do
      conn = get(conn, ~p"/api/profile/999999/plots")
      response = json_response(conn, 404)

      assert response["error"] == "User not found"
    end

    test "returns 400 when user ID is not an integer", %{conn: conn} do
      conn = get(conn, ~p"/api/profile/abc/plots")
      response = json_response(conn, 400)

      assert response["error"] == "Invalid user ID"
    end

    test "does not return plots from other users", %{conn: conn} do
      user1 = user_fixture()
      user2 = user_fixture()

      # Create plot for user1
      plot1 =
        plot_fixture(%{
          user_id: user1.id,
          name: "User 1 Plot",
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
            srid: 4326
          }
        })

      # Create plot for user2
      _plot2 =
        plot_fixture(%{
          user_id: user2.id,
          name: "User 2 Plot",
          polygon: %Geo.Polygon{
            coordinates: [[{20, 20}, {20, 30}, {30, 30}, {30, 20}, {20, 20}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/profile/#{user1.id}/plots")
      response = json_response(conn, 200)["data"]

      assert length(response) == 1
      assert List.first(response)["id"] == plot1.id
      assert List.first(response)["name"] == "User 1 Plot"
    end

    test "handles user with plot that has no polygon (edge case)", %{conn: conn} do
      user = user_fixture()

      # Create plot without polygon (if allowed in the system)
      {:ok, plot} =
        Api.Canvas.Plot.Repo.create_plot(%{
          name: "No Polygon Plot",
          description: "A plot without a polygon",
          user_id: user.id,
          polygon: nil
        })

      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      assert length(response) == 1
      plot_data = List.first(response)
      assert plot_data["id"] == plot.id
      assert plot_data["polygon"] == nil
    end

    test "returns plots with correct polygon coordinates", %{conn: conn} do
      user = user_fixture()

      # Create a plot with a more complex polygon
      _plot =
        plot_fixture(%{
          user_id: user.id,
          name: "Complex Polygon",
          polygon: %Geo.Polygon{
            coordinates: [
              [
                {100, 200},
                {150, 200},
                {150, 250},
                {125, 275},
                {100, 250},
                {100, 200}
              ]
            ],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      plot_data = List.first(response)

      expected_vertices = [
        [100, 200],
        [150, 200],
        [150, 250],
        [125, 275],
        [100, 250],
        [100, 200]
      ]

      assert plot_data["polygon"]["vertices"] == expected_vertices
    end

    test "returns plot scores correctly", %{conn: conn} do
      user = user_fixture()

      # Create plot with specific score
      {:ok, _plot} =
        Api.Canvas.Plot.Repo.create_plot(%{
          name: "Scored Plot",
          description: "A plot with a score",
          user_id: user.id,
          score: 42,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      plot_data = List.first(response)
      assert plot_data["score"] == 42
    end

    test "returns multiple plots in correct order", %{conn: conn} do
      user = user_fixture()

      # Create plots with different timestamps
      plot1 =
        plot_fixture(%{
          user_id: user.id,
          name: "Oldest Plot",
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 5}, {5, 5}, {5, 0}, {0, 0}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      plot2 =
        plot_fixture(%{
          user_id: user.id,
          name: "Middle Plot",
          polygon: %Geo.Polygon{
            coordinates: [[{10, 10}, {10, 15}, {15, 15}, {15, 10}, {10, 10}]],
            srid: 4326
          }
        })

      Process.sleep(10)

      plot3 =
        plot_fixture(%{
          user_id: user.id,
          name: "Newest Plot",
          polygon: %Geo.Polygon{
            coordinates: [[{20, 20}, {20, 25}, {25, 25}, {25, 20}, {20, 20}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      assert length(response) == 3

      plot_ids = Enum.map(response, & &1["id"])
      assert plot1.id in plot_ids
      assert plot2.id in plot_ids
      assert plot3.id in plot_ids
    end

    test "does not require authentication", %{conn: conn} do
      user = user_fixture()
      plot_fixture(%{user_id: user.id})

      # Make request without authentication
      conn = get(conn, ~p"/api/profile/#{user.id}/plots")
      response = json_response(conn, 200)["data"]

      assert length(response) == 1
    end
  end
end
