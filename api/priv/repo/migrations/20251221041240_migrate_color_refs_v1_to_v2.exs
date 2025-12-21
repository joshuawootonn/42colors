defmodule Api.Repo.Migrations.MigrateColorRefsV1ToV2 do
  use Ecto.Migration

  @doc """
  Migrates color_ref values from V1 palette to V2 palette.

  V1 to V2 mapping:
    0 → 0   (transparent)
    1 → 5   (black)
    2 → 1   (white)
    3 → 2
    4 → 3
    5 → 4
    6 → 5
    7 → 6
    8 → 7
    9 → 8
    10 → 9
    11 → 6
    12 → 7
    13 → 8
    14 → 9
    15 → 38
    16 → 39
    17 → 41
    18 → 5
    19 → 10
    20 → 11
    21 → 13
    22 → 5
    23 → 15
    24 → 16
    25 → 17
    26 → 5
    27 → 23
    28 → 24
    29 → 25
    30 → 5
    31 → 30
    32 → 31
    33 → 32
    34 → 33
    35 → 42
    36 → 35
    37 → 36
    38 → 37
    39 → 43
    40 → 39
    41 → 40
    42 → 41
  """
  def up do
    execute("""
    UPDATE pixels
    SET color_ref = CASE color_ref
      WHEN 0 THEN 0
      WHEN 1 THEN 5
      WHEN 2 THEN 1
      WHEN 3 THEN 2
      WHEN 4 THEN 3
      WHEN 5 THEN 4
      WHEN 6 THEN 5
      WHEN 7 THEN 6
      WHEN 8 THEN 7
      WHEN 9 THEN 8
      WHEN 10 THEN 9
      WHEN 11 THEN 6
      WHEN 12 THEN 7
      WHEN 13 THEN 8
      WHEN 14 THEN 9
      WHEN 15 THEN 38
      WHEN 16 THEN 39
      WHEN 17 THEN 41
      WHEN 18 THEN 5
      WHEN 19 THEN 10
      WHEN 20 THEN 11
      WHEN 21 THEN 13
      WHEN 22 THEN 5
      WHEN 23 THEN 15
      WHEN 24 THEN 16
      WHEN 25 THEN 17
      WHEN 26 THEN 5
      WHEN 27 THEN 23
      WHEN 28 THEN 24
      WHEN 29 THEN 25
      WHEN 30 THEN 5
      WHEN 31 THEN 30
      WHEN 32 THEN 31
      WHEN 33 THEN 32
      WHEN 34 THEN 33
      WHEN 35 THEN 42
      WHEN 36 THEN 35
      WHEN 37 THEN 36
      WHEN 38 THEN 37
      WHEN 39 THEN 43
      WHEN 40 THEN 39
      WHEN 41 THEN 40
      WHEN 42 THEN 41
      ELSE color_ref
    END
    """)
  end

  def down do
    # Note: This migration is not fully reversible because some V1 colors
    # map to the same V2 color (many-to-one). Colors 6, 18, 22, 26, 30 all
    # map to 5. We reverse the one-to-one mappings only.
    execute("""
    UPDATE pixels
    SET color_ref = CASE color_ref
      WHEN 0 THEN 0
      WHEN 5 THEN 1
      WHEN 1 THEN 2
      WHEN 2 THEN 3
      WHEN 3 THEN 4
      WHEN 4 THEN 5
      WHEN 6 THEN 7
      WHEN 7 THEN 8
      WHEN 8 THEN 9
      WHEN 9 THEN 10
      WHEN 38 THEN 15
      WHEN 39 THEN 16
      WHEN 41 THEN 17
      WHEN 10 THEN 19
      WHEN 11 THEN 20
      WHEN 13 THEN 21
      WHEN 15 THEN 23
      WHEN 16 THEN 24
      WHEN 17 THEN 25
      WHEN 23 THEN 27
      WHEN 24 THEN 28
      WHEN 25 THEN 29
      WHEN 30 THEN 31
      WHEN 31 THEN 32
      WHEN 32 THEN 33
      WHEN 33 THEN 34
      WHEN 42 THEN 35
      WHEN 35 THEN 36
      WHEN 36 THEN 37
      WHEN 37 THEN 38
      WHEN 43 THEN 39
      WHEN 40 THEN 41
      ELSE color_ref
    END
    """)
  end
end
