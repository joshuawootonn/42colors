defmodule ApiWeb.PlotControllerTest do
  use ApiWeb.ConnCase

  alias Api.Canvas.Plot

  import Api.CanvasFixtures
  import Api.AccountsFixtures

  @create_attrs %{name: "Test Plot", description: "Test Description"}
  @update_attrs %{name: "Updated Plot", description: "Updated Description"}
  @invalid_attrs %{name: nil, description: nil}

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    {:ok, conn: conn, user: user}
  end

  describe "index (chunk-based)" do
    test "returns plots within chunk when x,y parameters provided", %{conn: conn, user: user} do
      # Create a plot that should be found in the chunk
      plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{95, 95}, {95, 105}, {105, 105}, {105, 95}, {95, 95}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/plots?x=100&y=100")
      response = json_response(conn, 200)["data"]

      plot_ids = Enum.map(response, & &1["id"])
      assert plot.id in plot_ids
    end

    test "returns empty list when no plots in chunk", %{conn: conn} do
      conn = get(conn, ~p"/api/plots?x=1000&y=1000")
      response = json_response(conn, 200)["data"]
      assert response == []
    end

    test "returns error when x parameter is missing", %{conn: conn} do
      conn = get(conn, ~p"/api/plots?y=100")
      response = json_response(conn, 400)
      assert response["error"] == "x and y query parameters are required"
    end

    test "returns error when y parameter is missing", %{conn: conn} do
      conn = get(conn, ~p"/api/plots?x=100")
      response = json_response(conn, 400)
      assert response["error"] == "x and y query parameters are required"
    end

    test "returns error when both x and y parameters are missing", %{conn: conn} do
      conn = get(conn, ~p"/api/plots")
      response = json_response(conn, 400)
      assert response["error"] == "x and y query parameters are required"
    end

    test "returns error for invalid x coordinate", %{conn: conn} do
      conn = get(conn, ~p"/api/plots?x=abc&y=100")
      response = json_response(conn, 400)
      assert response["error"] == "Invalid x,y coordinates. Must be integers."
    end

    test "returns error for invalid y coordinate", %{conn: conn} do
      conn = get(conn, ~p"/api/plots?x=100&y=xyz")
      response = json_response(conn, 400)
      assert response["error"] == "Invalid x,y coordinates. Must be integers."
    end

    test "handles string coordinates correctly", %{conn: conn, user: user} do
      plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{95, 95}, {95, 105}, {105, 105}, {105, 95}, {95, 95}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/plots?x=100&y=100")
      response = json_response(conn, 200)["data"]

      plot_ids = Enum.map(response, & &1["id"])
      assert plot.id in plot_ids
    end

    test "handles negative coordinates", %{conn: conn, user: user} do
      plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{-105, -105}, {-105, -95}, {-95, -95}, {-95, -105}, {-105, -105}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/plots?x=-100&y=-100")
      response = json_response(conn, 200)["data"]

      plot_ids = Enum.map(response, & &1["id"])
      assert plot.id in plot_ids
    end

    test "returns plots from multiple users in chunk", %{conn: conn, user: user} do
      # Create another user and plot
      other_user = user_fixture()

      plot1 =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{95, 95}, {95, 105}, {105, 105}, {105, 95}, {95, 95}]],
            srid: 4326
          }
        })

      plot2 =
        plot_fixture(%{
          user_id: other_user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{90, 90}, {90, 110}, {110, 110}, {110, 90}, {90, 90}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/plots?x=100&y=100")
      response = json_response(conn, 200)["data"]

      plot_ids = Enum.map(response, & &1["id"])
      assert plot1.id in plot_ids
      assert plot2.id in plot_ids
    end
  end

  describe "me_plots" do
    test "lists all plots for the current user", %{conn: conn, user: user} do
      plot = plot_fixture(%{user_id: user.id})
      conn = get(conn, ~p"/api/plots/me")
      [resp_plot] = json_response(conn, 200)["data"]
      assert resp_plot["id"] == plot.id
      assert resp_plot["name"] == plot.name
      assert resp_plot["description"] == plot.description
      assert resp_plot["userId"] == user.id

      assert String.starts_with?(
               resp_plot["insertedAt"],
               NaiveDateTime.to_iso8601(plot.inserted_at)
             )

      assert String.starts_with?(
               resp_plot["updatedAt"],
               NaiveDateTime.to_iso8601(plot.updated_at)
             )
    end

    test "returns empty list when user has no plots", %{conn: conn} do
      conn = get(conn, ~p"/api/plots/me")
      response = json_response(conn, 200)["data"]
      assert response == []
    end

    test "only returns plots for the current user", %{conn: conn, user: user} do
      # Create plots for current user
      plot1 = plot_fixture(%{user_id: user.id})
      plot2 = plot_fixture(%{user_id: user.id})

      # Create plot for another user
      other_user = user_fixture()
      _other_plot = plot_fixture(%{user_id: other_user.id})

      conn = get(conn, ~p"/api/plots/me")
      response = json_response(conn, 200)["data"]

      plot_ids = Enum.map(response, & &1["id"])
      assert plot1.id in plot_ids
      assert plot2.id in plot_ids
      assert length(response) == 2
    end

    test "returns plots with correct structure", %{conn: conn, user: user} do
      plot =
        plot_fixture(%{
          user_id: user.id,
          polygon: %Geo.Polygon{
            coordinates: [[{0, 0}, {0, 10}, {10, 10}, {10, 0}, {0, 0}]],
            srid: 4326
          }
        })

      conn = get(conn, ~p"/api/plots/me")
      [resp_plot] = json_response(conn, 200)["data"]

      assert resp_plot["id"] == plot.id
      assert resp_plot["name"] == plot.name
      assert resp_plot["description"] == plot.description
      assert resp_plot["userId"] == user.id
      assert resp_plot["polygon"] != nil
      assert resp_plot["polygon"]["vertices"] == [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
    end
  end

  describe "create plot" do
    test "renders plot when data is valid with polygon", %{conn: conn, user: user} do
      polygon = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      attrs = Map.put(@create_attrs, :polygon, polygon)
      conn = post(conn, ~p"/api/plots", plot: attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")

      assert %{
               "id" => id2,
               "name" => "Test Plot",
               "description" => "Test Description",
               "userId" => user_id2
             } = json_response(conn, 200)["data"]

      assert id2 == id
      assert user_id2 == user.id
    end

    test "returns 400 when polygon is missing", %{conn: conn} do
      conn = post(conn, ~p"/api/plots", plot: @create_attrs)
      assert json_response(conn, 400)["error"] == "polygon is required"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/plots", plot: @invalid_attrs)
      assert json_response(conn, 400)["error"] == "polygon is required"
    end

    test "renders validation errors when name is missing", %{conn: conn} do
      polygon = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      attrs = %{description: "Test Description", polygon: polygon}
      conn = post(conn, ~p"/api/plots", plot: attrs)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot creation failed"
      assert response["errors"]["name"] == ["Name is required"]
    end

    test "renders validation errors when name is too long", %{conn: conn} do
      polygon = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      long_name = String.duplicate("a", 256)
      attrs = %{name: long_name, description: "Test Description", polygon: polygon}
      conn = post(conn, ~p"/api/plots", plot: attrs)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot creation failed"
      assert response["errors"]["name"] == ["Name must be between 1 and 255 characters"]
    end

    test "renders validation errors when description is too long", %{conn: conn} do
      polygon = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      long_description = String.duplicate("a", 1001)
      attrs = %{name: "Test Plot", description: long_description, polygon: polygon}
      conn = post(conn, ~p"/api/plots", plot: attrs)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot creation failed"

      assert response["errors"]["description"] == [
               "Description must be less than 1000 characters"
             ]
    end

    test "renders error for duplicate plot name", %{conn: conn} do
      # Create first plot
      polygon1 = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      attrs = %{name: "Duplicate Name", description: "First plot", polygon: polygon1}
      conn = post(conn, ~p"/api/plots", plot: attrs)
      assert json_response(conn, 201)

      # Try to create second plot with same name but different polygon (to avoid overlap)
      polygon2 = %{
        "vertices" => [
          [10, 10],
          [10, 11],
          [11, 11],
          [11, 10],
          [10, 10]
        ]
      }

      attrs2 = %{name: "Duplicate Name", description: "Second plot", polygon: polygon2}
      conn = post(conn, ~p"/api/plots", plot: attrs2)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot creation failed"
      assert response["errors"]["name"] == ["You already have a plot with this name"]
    end

    test "creates plot with polygon", %{conn: conn} do
      polygon = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      attrs = Map.put(@create_attrs, :polygon, polygon)
      conn = post(conn, ~p"/api/plots", plot: attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")
      resp = json_response(conn, 200)["data"]
      assert resp["id"] == id
      assert resp["polygon"] != nil
      expected_vertices = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
      assert resp["polygon"]["vertices"] == expected_vertices
    end

    test "creates plot with rectangular polygon", %{conn: conn} do
      polygon = %{
        "vertices" => [
          [22, 14],
          [22, 27],
          [41, 27],
          [41, 14],
          [22, 14]
        ]
      }

      attrs = Map.put(@create_attrs, :polygon, polygon)
      conn = post(conn, ~p"/api/plots", plot: attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")
      resp = json_response(conn, 200)["data"]
      assert resp["id"] == id
      assert resp["polygon"] != nil
      expected_vertices = [[22, 14], [22, 27], [41, 27], [41, 14], [22, 14]]
      assert resp["polygon"]["vertices"] == expected_vertices
    end

    test "returns overlap error when plot overlaps with existing plot", %{conn: conn} do
      # Create first plot
      existing_polygon = %{
        "vertices" => [
          [10, 10],
          [10, 30],
          [30, 30],
          [30, 10],
          [10, 10]
        ]
      }

      existing_attrs = %{
        name: "Existing Plot",
        description: "First plot",
        polygon: existing_polygon
      }

      conn = post(conn, ~p"/api/plots", plot: existing_attrs)
      assert %{"id" => _existing_id} = json_response(conn, 201)["data"]

      # Try to create overlapping plot
      overlapping_polygon = %{
        "vertices" => [
          [20, 20],
          [20, 40],
          [40, 40],
          [40, 20],
          [20, 20]
        ]
      }

      overlapping_attrs = %{
        name: "Overlapping Plot",
        description: "Overlapping plot",
        polygon: overlapping_polygon
      }

      conn = post(conn, ~p"/api/plots", plot: overlapping_attrs)
      response = json_response(conn, 422)

      assert response["status"] == "error"
      assert response["message"] == "Plot overlaps with existing plots"
      assert length(response["overlapping_plots"]) == 1
      assert List.first(response["overlapping_plots"])["name"] == "Existing Plot"
    end

    test "allows non-overlapping plots to be created", %{conn: conn} do
      # Create first plot
      first_polygon = %{
        "vertices" => [
          [10, 10],
          [10, 30],
          [30, 30],
          [30, 10],
          [10, 10]
        ]
      }

      first_attrs = %{name: "First Plot", description: "First plot", polygon: first_polygon}
      conn = post(conn, ~p"/api/plots", plot: first_attrs)
      assert %{"id" => _first_id} = json_response(conn, 201)["data"]

      # Create non-overlapping plot
      non_overlapping_polygon = %{
        "vertices" => [
          [50, 50],
          [50, 70],
          [70, 70],
          [70, 50],
          [50, 50]
        ]
      }

      non_overlapping_attrs = %{
        name: "Non-overlapping Plot",
        description: "Non-overlapping plot",
        polygon: non_overlapping_polygon
      }

      conn = post(conn, ~p"/api/plots", plot: non_overlapping_attrs)
      assert %{"id" => _second_id} = json_response(conn, 201)["data"]
    end
  end

  describe "update plot" do
    setup %{user: user} do
      plot = plot_fixture(%{user_id: user.id})
      %{plot: plot}
    end

    test "renders plot when data is valid", %{conn: conn, plot: %Plot{id: id} = plot} do
      conn = put(conn, ~p"/api/plots/#{plot}", plot: @update_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")

      assert %{
               "id" => id2,
               "name" => "Updated Plot",
               "description" => "Updated Description"
             } = json_response(conn, 200)["data"]

      assert id2 == id
    end

    test "renders errors when data is invalid", %{conn: conn, plot: plot} do
      conn = put(conn, ~p"/api/plots/#{plot}", plot: @invalid_attrs)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot update failed"
      assert response["errors"]["name"] == ["Name is required"]
    end

    test "renders validation errors when name is too long", %{conn: conn, plot: plot} do
      long_name = String.duplicate("a", 256)
      attrs = %{name: long_name, description: "Updated Description"}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: attrs)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot update failed"
      assert response["errors"]["name"] == ["Name must be between 1 and 255 characters"]
    end

    test "renders validation errors when description is too long", %{conn: conn, plot: plot} do
      long_description = String.duplicate("a", 1001)
      attrs = %{name: "Updated Plot", description: long_description}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: attrs)
      response = json_response(conn, 422)
      assert response["status"] == "error"
      assert response["message"] == "Plot update failed"

      assert response["errors"]["description"] == [
               "Description must be less than 1000 characters"
             ]
    end

    test "updates plot with new polygon when no overlaps", %{conn: conn, plot: plot} do
      new_polygon = %{
        "vertices" => [
          [50, 50],
          [50, 70],
          [70, 70],
          [70, 50],
          [50, 50]
        ]
      }

      attrs = %{name: "Updated Plot", polygon: new_polygon}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: attrs)
      assert %{"id" => id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")
      resp = json_response(conn, 200)["data"]
      assert resp["name"] == "Updated Plot"
      assert resp["polygon"]["vertices"] == [[50, 50], [50, 70], [70, 70], [70, 50], [50, 50]]
    end

    test "returns overlap error when updated polygon overlaps with existing plot", %{
      conn: conn,
      plot: plot
    } do
      # Create another plot that will be overlapped
      existing_polygon = %{
        "vertices" => [
          [30, 30],
          [30, 50],
          [50, 50],
          [50, 30],
          [30, 30]
        ]
      }

      existing_attrs = %{
        name: "Existing Plot",
        description: "Existing plot",
        polygon: existing_polygon
      }

      conn = post(conn, ~p"/api/plots", plot: existing_attrs)
      assert %{"id" => _existing_id} = json_response(conn, 201)["data"]

      # Try to update original plot with overlapping polygon
      overlapping_polygon = %{
        "vertices" => [
          [35, 35],
          [35, 55],
          [55, 55],
          [55, 35],
          [35, 35]
        ]
      }

      attrs = %{name: "Updated Plot", polygon: overlapping_polygon}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: attrs)
      response = json_response(conn, 422)

      assert response["status"] == "error"
      assert response["message"] == "Plot overlaps with existing plots"
      assert length(response["overlapping_plots"]) == 1
      assert List.first(response["overlapping_plots"])["name"] == "Existing Plot"
    end

    test "allows plot to be updated with same polygon (no self-overlap)", %{
      conn: conn,
      plot: plot
    } do
      # First, update the plot to have a polygon
      initial_polygon = %{
        "vertices" => [
          [10, 10],
          [10, 20],
          [20, 20],
          [20, 10],
          [10, 10]
        ]
      }

      attrs = %{name: "Plot with Polygon", polygon: initial_polygon}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: attrs)
      assert %{"id" => id} = json_response(conn, 200)["data"]

      # Now update with the same polygon - should work (no self-overlap)
      same_polygon_attrs = %{name: "Same Polygon Plot", polygon: initial_polygon}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: same_polygon_attrs)
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")
      resp = json_response(conn, 200)["data"]
      assert resp["name"] == "Same Polygon Plot"
      assert resp["polygon"]["vertices"] == [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]]
    end

    test "updates plot without polygon validation when no polygon provided", %{
      conn: conn,
      plot: plot
    } do
      attrs = %{name: "Updated Name Only", description: "Updated Description Only"}
      conn = put(conn, ~p"/api/plots/#{plot}", plot: attrs)
      assert %{"id" => id} = json_response(conn, 200)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")
      resp = json_response(conn, 200)["data"]
      assert resp["name"] == "Updated Name Only"
      assert resp["description"] == "Updated Description Only"
    end
  end

  describe "delete plot" do
    setup %{user: user} do
      plot = plot_fixture(%{user_id: user.id})
      %{plot: plot}
    end

    test "deletes chosen plot", %{conn: conn, plot: plot} do
      conn = delete(conn, ~p"/api/plots/#{plot}")
      assert response(conn, 204)

      conn = get(conn, ~p"/api/plots/#{plot}")
      assert response(conn, 404)
    end

    test "returns 404 when trying to delete non-existent plot", %{conn: conn} do
      conn = delete(conn, ~p"/api/plots/999999")
      assert response(conn, 404)
    end
  end
end
