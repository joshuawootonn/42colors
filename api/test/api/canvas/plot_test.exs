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
end
