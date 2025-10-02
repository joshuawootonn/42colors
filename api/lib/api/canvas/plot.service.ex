defmodule Api.Canvas.Plot.Service do
  @moduledoc """
  Service module for plot operations with business logic.
  """

  alias Api.Canvas.Plot
  alias Api.Logs.Log.Service, as: LogService
  alias Ecto.Multi
  alias Api.Repo

  @chunk_size 400

  @doc """
  Lists plots within a 400x400 chunk based on the given x,y coordinates.

  The chunk is calculated by centering a 400x400 square around the given coordinates,
  then finding all plots that intersect with this area.

  ## Parameters
  - `x`: X coordinate (integer, center of the chunk)
  - `y`: Y coordinate (integer, center of the chunk)

  ## Returns
  - List of %Plot{} structs that intersect with the chunk area

  ## Examples

      iex> Plot.Service.list_plots_by_chunk(100, 100)
      [%Plot{}, ...]

      iex> Plot.Service.list_plots_by_chunk(0, 0)
      []

  ## Note
  This function only accepts integer coordinates. String parsing and validation
  should be handled at the controller layer.
  """
  def list_plots_by_chunk(x, y) when is_integer(x) and is_integer(y) do
    # Calculate chunk boundaries (400x400 centered on x,y)
    min_x = x
    max_x = x + @chunk_size
    min_y = y
    max_y = y + @chunk_size

    # Create a polygon representing the chunk area
    chunk_polygon = %Geo.Polygon{
      coordinates: [
        [
          {min_x, min_y},
          {min_x, max_y},
          {max_x, max_y},
          {max_x, min_y},
          {min_x, min_y}
        ]
      ],
      srid: 4326
    }

    Plot.Repo.list_plots_within_polygon(chunk_polygon)
  end

  @doc """
  Creates a plot with overlap validation.

  Validates that the new plot doesn't overlap with any existing plots
  before creating it.

  ## Parameters
  - `attrs`: Map of plot attributes including polygon

  ## Returns
  - `{:ok, %Plot{}}` if creation is successful
  - `{:error, :overlapping_plots, overlapping_plots}` if plot overlaps with existing plots
  - `{:error, %Ecto.Changeset{}}` if there are validation errors

  ## Examples

      iex> Plot.Service.create_plot(%{name: "Test", user_id: 1, polygon: polygon})
      {:ok, %Plot{}}

      iex> Plot.Service.create_plot(%{name: "Overlapping", user_id: 1, polygon: overlapping_polygon})
      {:error, :overlapping_plots, [%Plot{}]}

  """
  def create_plot(attrs) do
    case Map.get(attrs, "polygon") || Map.get(attrs, :polygon) do
      nil ->
        # If no polygon provided, proceed with normal validation (will fail in changeset)
        Plot.Repo.create_plot(attrs)

      polygon ->
        case check_for_overlaps(polygon, nil) do
          [] ->
            # No overlaps, proceed with creation and logging
            user_id = Map.get(attrs, "user_id") || Map.get(attrs, :user_id)
            pixel_count = Plot.Repo.get_size(polygon)
            # Negative because user is spending currency
            cost = -pixel_count

            # Calculate what fields are being set (for logging)
            empty_plot = %Plot{}
            changes = get_plot_diff(empty_plot, attrs)

            # Check if user_id is provided before fetching user
            if is_nil(user_id) do
              # If no user_id provided, proceed with normal validation (will fail in changeset)
              Plot.Repo.create_plot(attrs)
            else
              # Get user outside of the transaction
              case Repo.get(Api.Accounts.User, user_id) do
                nil ->
                  {:error, :user_not_found}

                user ->
                  # Calculate balance diff using the public function
                  balance_change = LogService.calculate_balance_change(user.balance, cost)

                  Multi.new()
                  |> Multi.insert(:plot, Plot.changeset(%Plot{}, attrs))
                  |> Multi.run(:log, fn _repo, %{plot: plot} ->
                    LogService.create_log(%{
                      user_id: user_id,
                      old_balance: balance_change.old_balance,
                      new_balance: balance_change.new_balance,
                      log_type: "plot_created",
                      plot_id: plot.id,
                      diffs: changes
                    })
                  end)
                  |> Repo.transaction()
                  |> case do
                    {:ok, %{plot: plot, log: {_log, _user}}} ->
                      {:ok, plot}

                    {:error, :plot, changeset, _changes} ->
                      {:error, changeset}

                    {:error, :log, reason, _changes} ->
                      {:error, reason}

                    {:error, _failed_operation, reason, _changes} ->
                      {:error, reason}
                  end
              end
            end

          overlapping_plots ->
            # Found overlaps, return error with details
            {:error, :overlapping_plots, overlapping_plots}
        end
    end
  end

  # Private helper function for updating with logging
  defp _update_plot(%Plot{} = plot, attrs, changes) do
    # Only create log if there are actual changes
    if Enum.empty?(changes) do
      # No changes, just return the plot as-is
      {:ok, plot}
    else
      # Calculate pixel count difference for cost calculation
      old_pixel_count = Plot.Repo.get_size(plot.polygon)
      new_polygon = Map.get(attrs, "polygon") || Map.get(attrs, :polygon) || plot.polygon
      new_pixel_count = Plot.Repo.get_size(new_polygon)
      pixel_diff = new_pixel_count - old_pixel_count
      # Negative if user needs to pay more, positive if refund
      cost = -pixel_diff

      # Use actual cost (can be zero for metadata-only changes)

      # Get user outside of the transaction
      case Repo.get(Api.Accounts.User, plot.user_id) do
        nil ->
          {:error, :user_not_found}

        user ->
          # Calculate balance diff using the public function
          balance_change = LogService.calculate_balance_change(user.balance, cost)

          Multi.new()
          |> Multi.update(:plot, Plot.changeset(plot, attrs))
          |> Multi.run(:log, fn _repo, %{plot: _updated_plot} ->
            LogService.create_log(%{
              user_id: plot.user_id,
              old_balance: balance_change.old_balance,
              new_balance: balance_change.new_balance,
              log_type: "plot_updated",
              plot_id: plot.id,
              diffs: changes
            })
          end)
      end
      |> Repo.transaction()
      |> case do
        {:ok, %{plot: plot, log: {_log, _user}}} ->
          {:ok, plot}

        {:error, :plot, changeset, _changes} ->
          {:error, changeset}

        {:error, :log, reason, _changes} ->
          {:error, reason}

        {:error, _failed_operation, reason, _changes} ->
          {:error, reason}
      end
    end
  end

  @doc """
  Updates a plot with overlap validation.

  Validates that the updated plot doesn't overlap with any existing plots
  (excluding itself) before updating it.

  ## Parameters
  - `plot`: The existing %Plot{} struct to update
  - `attrs`: Map of plot attributes to update

  ## Returns
  - `{:ok, %Plot{}}` if update is successful
  - `{:error, :overlapping_plots, overlapping_plots}` if plot overlaps with existing plots
  - `{:error, %Ecto.Changeset{}}` if there are validation errors

  ## Examples

      iex> Plot.Service.update_plot(plot, %{name: "Updated"})
      {:ok, %Plot{}}

      iex> Plot.Service.update_plot(plot, %{polygon: overlapping_polygon})
      {:error, :overlapping_plots, [%Plot{}]}

  """
  def update_plot(%Plot{} = plot, attrs) do
    # Check if polygon is being updated
    new_polygon = Map.get(attrs, "polygon") || Map.get(attrs, :polygon)

    # Calculate changes for logging
    changes = get_plot_diff(plot, attrs)

    case new_polygon do
      nil ->
        # No polygon update, proceed with normal update and logging
        _update_plot(plot, attrs, changes)

      polygon ->
        case check_for_overlaps(polygon, plot.id) do
          [] ->
            # No overlaps, proceed with update and logging
            _update_plot(plot, attrs, changes)

          overlapping_plots ->
            # Found overlaps, return error with details
            {:error, :overlapping_plots, overlapping_plots}
        end
    end
  end

  def delete_plot(%Plot{} = plot) do
    # Calculate refund amount based on original pixel count
    pixel_count = Plot.Repo.get_size(plot.polygon)
    # Positive because user is getting currency back
    refund_amount = pixel_count

    # Calculate diffs for deletion (all fields go from current values to nil/deleted)
    deletion_attrs = %{deleted_at: DateTime.utc_now()}
    diffs = get_plot_diff(plot, deletion_attrs)

    # Get user outside of the transaction
    case Repo.get(Api.Accounts.User, plot.user_id) do
      nil ->
        {:error, :user_not_found}

      user ->
        # Calculate balance change using the public function
        balance_change = LogService.calculate_balance_change(user.balance, refund_amount)

        Multi.new()
        |> Multi.update(:plot, Plot.changeset(plot, deletion_attrs))
        |> Multi.run(:log, fn _repo, %{plot: _updated_plot} ->
          LogService.create_log(%{
            user_id: plot.user_id,
            old_balance: balance_change.old_balance,
            new_balance: balance_change.new_balance,
            log_type: "plot_deleted",
            plot_id: plot.id,
            diffs: diffs
          })
        end)
    end
    |> Repo.transaction()
    |> case do
      {:ok, %{plot: plot, log: {_log, _user}}} ->
        {:ok, plot}

      {:error, :plot, changeset, _changes} ->
        {:error, changeset}

      {:error, :log, reason, _changes} ->
        {:error, reason}

      {:error, _failed_operation, reason, _changes} ->
        {:error, reason}
    end
  end

  @doc """
  Lists plots with configurable options.

  This function provides a global list of all plots with configurable
  sorting and filtering options. Currently supports limit configuration,
  with future extensibility for user filtering, different sort orders, etc.

  ## Parameters
  - `opts`: Map of list options
    - `limit`: Maximum number of plots to return (default: 10, max: 100)

  ## Returns
  - List of %Plot{} structs sorted by creation date (newest first)

  ## Examples

      iex> Plot.Service.list_plots(%{})
      [%Plot{}, ...]

      iex> Plot.Service.list_plots(%{limit: 5})
      [%Plot{}, ...]

  """
  def list_plots(opts \\ %{}) do
    Plot.Repo.list_plots(opts)
  end

  @doc """
  Returns the chunk size used for spatial queries.
  """
  def chunk_size, do: @chunk_size

  # Private helper function to calculate what changed in a plot update
  defp get_plot_diff(%Plot{} = plot, attrs) do
    changes = %{}

    # Check name change
    changes =
      if Map.has_key?(attrs, "name") || Map.has_key?(attrs, :name) do
        new_name = Map.get(attrs, "name") || Map.get(attrs, :name)

        if new_name != plot.name do
          Map.put(changes, "name", %{"old" => plot.name, "new" => new_name})
        else
          changes
        end
      else
        changes
      end

    # Check description change
    changes =
      if Map.has_key?(attrs, "description") || Map.has_key?(attrs, :description) do
        new_description = Map.get(attrs, "description") || Map.get(attrs, :description)

        if new_description != plot.description do
          Map.put(changes, "description", %{"old" => plot.description, "new" => new_description})
        else
          changes
        end
      else
        changes
      end

    # Check polygon change (for future when polygon editing is supported)
    changes =
      if Map.has_key?(attrs, "polygon") || Map.has_key?(attrs, :polygon) do
        new_polygon = Map.get(attrs, "polygon") || Map.get(attrs, :polygon)

        if new_polygon != plot.polygon do
          old_pixel_count = Plot.Repo.get_size(plot.polygon)
          new_pixel_count = Plot.Repo.get_size(new_polygon)

          Map.put(changes, "polygon", %{
            "old_pixel_count" => old_pixel_count,
            "new_pixel_count" => new_pixel_count
          })
        else
          changes
        end
      else
        changes
      end

    # Check deleted_at change (for soft deletion)
    changes =
      if Map.has_key?(attrs, "deleted_at") || Map.has_key?(attrs, :deleted_at) do
        new_deleted_at = Map.get(attrs, "deleted_at") || Map.get(attrs, :deleted_at)

        if new_deleted_at != plot.deleted_at do
          Map.put(changes, "deleted_at", %{"old" => plot.deleted_at, "new" => new_deleted_at})
        else
          changes
        end
      else
        changes
      end

    changes
  end

  # Private function to check for overlapping plots
  defp check_for_overlaps(polygon, exclude_plot_id) do
    overlapping_plots = Plot.Repo.list_plots_within_polygon(polygon)

    case exclude_plot_id do
      nil ->
        # Creating new plot, check against all existing plots
        overlapping_plots

      plot_id ->
        # Updating existing plot, exclude itself from overlap check
        Enum.filter(overlapping_plots, fn plot -> plot.id != plot_id end)
    end
  end
end
