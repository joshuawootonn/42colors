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

  describe "index" do
    test "lists all plots for the current user", %{conn: conn, user: user} do
      plot = plot_fixture(%{user_id: user.id})
      conn = get(conn, ~p"/api/plots")
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
      assert response["errors"]["description"] == ["Description must be less than 1000 characters"]
    end

    test "renders error for duplicate plot name", %{conn: conn} do
      # Create first plot
      polygon = %{
        "vertices" => [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      }

      attrs = %{name: "Duplicate Name", description: "First plot", polygon: polygon}
      conn = post(conn, ~p"/api/plots", plot: attrs)
      assert json_response(conn, 201)

      # Try to create second plot with same name
      attrs2 = %{name: "Duplicate Name", description: "Second plot", polygon: polygon}
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
      assert response["errors"]["description"] == ["Description must be less than 1000 characters"]
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
