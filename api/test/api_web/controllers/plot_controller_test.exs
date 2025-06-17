defmodule ApiWeb.PlotControllerTest do
  use ApiWeb.ConnCase

  alias Api.Plots
  alias Api.Plots.Plot

  import Api.PlotsFixtures
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
      assert resp_plot["user_id"] == user.id
      assert String.starts_with?(resp_plot["inserted_at"], NaiveDateTime.to_iso8601(plot.inserted_at))
      assert String.starts_with?(resp_plot["updated_at"], NaiveDateTime.to_iso8601(plot.updated_at))
    end
  end

  describe "create plot" do
    test "renders plot when data is valid", %{conn: conn, user: user} do
      conn = post(conn, ~p"/api/plots", plot: @create_attrs)
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get(conn, ~p"/api/plots/#{id}")
      assert %{
        "id" => id2,
        "name" => "Test Plot",
        "description" => "Test Description",
        "user_id" => user_id2
      } = json_response(conn, 200)["data"]
      assert id2 == id
      assert user_id2 == user.id
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/plots", plot: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update plot" do
    setup %{conn: conn, user: user} do
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
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete plot" do
    setup %{conn: conn, user: user} do
      plot = plot_fixture(%{user_id: user.id})
      %{plot: plot}
    end

    test "deletes chosen plot", %{conn: conn, plot: plot} do
      conn = delete(conn, ~p"/api/plots/#{plot}")
      assert response(conn, 204)

      conn = get(conn, ~p"/api/plots/#{plot}")
      assert response(conn, 404)
    end
  end
end
