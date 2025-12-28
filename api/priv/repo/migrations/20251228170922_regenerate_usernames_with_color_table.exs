defmodule Api.Repo.Migrations.RegenerateUsernamesWithColorTable do
  use Ecto.Migration

  @color_table %{
    0 => "transparent",
    1 => "white",
    2 => "alabaster",
    3 => "silver",
    4 => "charcoal",
    5 => "black",
    6 => "petal",
    7 => "cinnamon",
    8 => "umber",
    9 => "walnut",
    10 => "peach",
    11 => "pumpkin",
    12 => "cayenne",
    13 => "burnt",
    14 => "custard",
    15 => "lemon",
    16 => "saffron",
    17 => "goldenrod",
    18 => "keylime",
    19 => "algea",
    20 => "khaki",
    21 => "olive",
    22 => "celadon",
    23 => "radioactive",
    24 => "shamrock",
    25 => "emerald",
    26 => "ice",
    27 => "cyan",
    28 => "teal",
    29 => "favorite",
    30 => "sky",
    31 => "azure",
    32 => "royal",
    33 => "twilight",
    34 => "mauve",
    35 => "lavender",
    36 => "barney",
    37 => "indigo",
    38 => "lobster",
    39 => "blood",
    40 => "ruby",
    41 => "rose",
    42 => "bubblegum",
    43 => "kiss"
  }

  @color_count map_size(@color_table)

  def up do
    # Get all users ordered by ID (which represents registration order)
    users = repo().query!("SELECT id FROM users ORDER BY id ASC")

    # Regenerate username for each user based on their position (0-indexed)
    users.rows
    |> Enum.with_index()
    |> Enum.each(fn {[user_id], index} ->
      new_username = generate_username(index)

      repo().query!(
        "UPDATE users SET username = $1 WHERE id = $2",
        [new_username, user_id]
      )
    end)
  end

  def down do
    # No rollback - usernames are just cosmetic
    :ok
  end

  defp generate_username(user_count) do
    # Use modulo to cycle through colors if we have more users than colors
    color_index = rem(user_count, @color_count)
    color = @color_table[color_index]
    # Calculate which cycle we're in (0 for first 44 users, 1 for next 44, etc.)
    cycle = div(user_count, @color_count)

    if cycle == 0 do
      # First 44 users just get the color name
      color
    else
      # Subsequent users get color-cycle (e.g., "white-1", "alabaster-2")
      "#{color}-#{cycle}"
    end
  end
end
