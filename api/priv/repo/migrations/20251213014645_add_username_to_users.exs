defmodule Api.Repo.Migrations.AddUsernameToUsers do
  use Ecto.Migration

  @color_names ~w(
    Coral Crimson Scarlet Ruby Rose Blush Salmon Cherry Garnet Burgundy
    Maroon Raspberry Cerise Carmine Amber Tangerine Peach Apricot Ginger
    Paprika Rust Copper Bronze Sienna Terra Gold Honey Marigold Lemon
    Canary Buttercup Goldenrod Flax Lime Mint Jade Emerald Forest Olive
    Sage Pine Moss Fern Clover Hunter Willow Basil Teal Cyan Azure Cobalt
    Navy Sky Ocean Sapphire Denim Steel Arctic Cerulean Admiral Periwinkle
    Indigo Violet Plum Lavender Orchid Grape Iris Mulberry Amethyst Royal
    Wisteria Slate Charcoal Onyx Ivory Pearl Silver Ash Stone Cloud Snow
    Smoke Graphite Pewter Dusk Chestnut Walnut Cocoa Mocha Espresso Caramel
    Cinnamon Auburn Mahogany Hazel Maple Acorn Magenta Powder
  )

  def up do
    # Add username column (nullable initially)
    alter table(:users) do
      add :username, :string
    end

    # Flush to ensure column exists before update
    flush()

    # Backfill existing users with random color + ID
    execute(fn ->
      repo().query!(
        "SELECT id FROM users",
        []
      )
      |> Map.get(:rows)
      |> Enum.each(fn [id] ->
        color = Enum.random(@color_names)
        username = "#{color}-#{id}"

        repo().query!(
          "UPDATE users SET username = $1 WHERE id = $2",
          [username, id]
        )
      end)
    end)

    # Make username non-nullable and add unique constraint
    alter table(:users) do
      modify :username, :string, null: false
    end

    create unique_index(:users, [:username])
  end

  def down do
    drop_if_exists index(:users, [:username])

    alter table(:users) do
      remove :username
    end
  end
end
