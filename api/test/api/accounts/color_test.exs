defmodule Api.Accounts.ColorTest do
  use Api.DataCase, async: true

  alias Api.Accounts.Color

  describe "color schema" do
    test "all 44 colors are seeded in the database" do
      colors = Repo.all(Color)
      assert length(colors) == 44
    end

    test "first color is transparent with id 0" do
      color = Repo.get(Color, 0)
      assert color.id == 0
      assert color.name == "transparent"
      assert color.hex_code == "transparent"
    end

    test "last color is watermelon with id 43" do
      color = Repo.get(Color, 43)
      assert color.id == 43
      assert color.name == "watermelon"
      assert color.hex_code == "#F375A4"
    end

    test "color names are unique" do
      colors = Repo.all(Color)
      names = Enum.map(colors, & &1.name)
      assert length(names) == length(Enum.uniq(names))
    end

    test "sample colors have correct hex codes" do
      alabaster = Repo.get(Color, 1)
      assert alabaster.name == "alabaster"
      assert alabaster.hex_code == "#ffffff"

      onyx = Repo.get(Color, 5)
      assert onyx.name == "onyx"
      assert onyx.hex_code == "#000000"

      ruby = Repo.get(Color, 40)
      assert ruby.name == "ruby"
      assert ruby.hex_code == "#A70D2E"
    end
  end
end
