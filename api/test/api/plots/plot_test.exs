defmodule Api.Plots.PlotTest do
  use Api.DataCase

  alias Api.Plots.Plot

  describe "plots" do
    import Api.PlotsFixtures

    @invalid_attrs %{name: nil, user_id: nil, polygon: nil}

    test "list_user_plots/1 returns all plots for a user" do
      plot = plot_fixture()
      assert Api.Plots.list_user_plots(plot.user_id) == [plot]
    end

    test "get_plot!/1 returns the plot with given id" do
      plot = plot_fixture()
      assert Api.Plots.get_plot!(plot.id) == plot
    end

    test "create_plot/1 with valid data creates a plot" do
      user = Api.AccountsFixtures.user_fixture()
      valid_attrs = %{name: "some name", user_id: user.id, polygon: %Geo.Polygon{coordinates: [[{0, 0}, {0, 1}, {1, 1}, {1, 0}, {0, 0}]], srid: 4326}}

      assert {:ok, %Plot{} = plot} = Api.Plots.create_plot(valid_attrs)
      assert plot.name == "some name"
      assert plot.user_id == user.id
      assert plot.polygon == %Geo.Polygon{coordinates: [[{0, 0}, {0, 1}, {1, 1}, {1, 0}, {0, 0}]], srid: 4326}
    end

    test "create_plot/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Api.Plots.create_plot(@invalid_attrs)
    end

    test "update_plot/2 with valid data updates the plot" do
      plot = plot_fixture()
      user = Api.AccountsFixtures.user_fixture()
      update_attrs = %{name: "some updated name", user_id: user.id, polygon: %Geo.Polygon{coordinates: [[{0, 0}, {0, 2}, {2, 2}, {2, 0}, {0, 0}]], srid: 4326}}

      assert {:ok, %Plot{} = plot} = Api.Plots.update_plot(plot, update_attrs)
      assert plot.name == "some updated name"
      assert plot.user_id == user.id
      assert plot.polygon == %Geo.Polygon{coordinates: [[{0, 0}, {0, 2}, {2, 2}, {2, 0}, {0, 0}]], srid: 4326}
    end

    test "update_plot/2 with invalid data returns error changeset" do
      plot = plot_fixture()
      assert {:error, %Ecto.Changeset{}} = Api.Plots.update_plot(plot, @invalid_attrs)
      assert plot == Api.Plots.get_plot!(plot.id)
    end

    test "delete_plot/1 deletes the plot" do
      plot = plot_fixture()
      assert {:ok, %Plot{}} = Api.Plots.delete_plot(plot)
      assert_raise Ecto.NoResultsError, fn -> Api.Plots.get_plot!(plot.id) end
    end

    test "change_plot/1 returns a plot changeset" do
      plot = plot_fixture()
      assert %Ecto.Changeset{} = Api.Plots.change_plot(plot)
    end
  end
end
