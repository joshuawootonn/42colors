defmodule Api.Accounts.UsernameCount.Repo do
  import Ecto.Query
  alias Api.Accounts.{UsernameCount, Color}
  alias Api.Repo

  @doc """
  Gets or creates a username count record for the given color_id.
  Returns the username count record.
  """
  def get_or_create_count(color_id) do
    case Repo.get_by(UsernameCount, color_id: color_id) do
      nil ->
        %UsernameCount{}
        |> UsernameCount.changeset(%{color_id: color_id, count: 0})
        |> Repo.insert()
        |> case do
          {:ok, username_count} -> username_count
          {:error, changeset} -> {:error, changeset}
        end

      username_count ->
        username_count
    end
  end

  @doc """
  Atomically increments the count for the given color_id.
  Returns {:ok, new_count} on success.
  """
  def increment_count(color_id) do
    # Ensure the record exists first
    get_or_create_count(color_id)

    # Atomically increment using SQL
    {1, [%{count: new_count}]} =
      Repo.update_all(
        from(uc in UsernameCount, where: uc.color_id == ^color_id, select: [:count]),
        inc: [count: 1]
      )

    {:ok, new_count}
  end

  @doc """
  Returns the next available username for the given color_id.
  Format: "transparent" for count 0, "transparent1" for count 1, etc. (no dashes)
  """
  def get_next_username(color_id) do
    username_count = get_or_create_count(color_id)
    color = Repo.get!(Color, color_id)

    count =
      case username_count do
        %UsernameCount{count: count} -> count
        {:error, _} -> 0
      end

    if count == 0 do
      color.name
    else
      "#{color.name}#{count}"
    end
  end
end
