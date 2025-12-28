defmodule Api.Repo.Migrations.CreateColors do
  use Ecto.Migration

  def up do
    create table(:colors, primary_key: false) do
      add :id, :integer, primary_key: true
      add :name, :string, null: false
      add :hex_code, :string, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:colors, [:name])

    # Seed all 44 colors with data mapped from existing hex codes by index
    colors = [
      {0, "transparent", "transparent"},
      {1, "alabaster", "#ffffff"},
      {2, "smoke", "#DFDFDF"},
      {3, "stone", "#ADADAD"},
      {4, "charcoal", "#626262"},
      {5, "onyx", "#000000"},
      {6, "biscuit", "#E7CFBE"},
      {7, "camel", "#B97C55"},
      {8, "cinnamon", "#8A3E08"},
      {9, "walnut", "#623510"},
      {10, "peach", "#F5BE8C"},
      {11, "pumpkin", "#F38846"},
      {12, "terracotta", "#E75B15"},
      {13, "rust", "#C4480D"},
      {14, "banana", "#F6EE96"},
      {15, "lemon", "#F5E826"},
      {16, "goldenrod", "#F4C72C"},
      {17, "brass", "#C18817"},
      {18, "keylime", "#E0EC6B"},
      {19, "avocado", "#96B115"},
      {20, "olive", "#958814"},
      {21, "seaweed", "#575308"},
      {22, "celadon", "#B6EBAD"},
      {23, "shamrock", "#62D842"},
      {24, "emerald", "#1C9850"},
      {25, "evergreen", "#10633D"},
      {26, "aquamarine", "#ACF6EF"},
      {27, "cyan", "#2BCEC3"},
      {28, "ocean", "#1C9393"},
      {29, "peacock", "#106068"},
      {30, "sky", "#AEE4FF"},
      {31, "azure", "#1F8FF2"},
      {32, "royal", "#1248BD"},
      {33, "twilight", "#09148D"},
      {34, "lavender", "#C7B4F5"},
      {35, "violet", "#8155D8"},
      {36, "plum", "#7634A7"},
      {37, "indigo", "#360881"},
      {38, "lobster", "#EE6071"},
      {39, "scarlet", "#D51010"},
      {40, "ruby", "#A70D2E"},
      {41, "wine", "#830819"},
      {42, "bubblegum", "#F5B3E0"},
      {43, "watermelon", "#F375A4"}
    ]

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    Enum.each(colors, fn {id, name, hex_code} ->
      execute("""
      INSERT INTO colors (id, name, hex_code, inserted_at, updated_at)
      VALUES (#{id}, '#{name}', '#{hex_code}', '#{now}', '#{now}')
      """)
    end)
  end

  def down do
    drop table(:colors)
  end
end
