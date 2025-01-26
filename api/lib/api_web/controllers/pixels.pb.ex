defmodule Pixel do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.14.0", syntax: :proto3

  field :x, 1, type: :sint32
  field :y, 2, type: :sint32
  field :color, 3, type: :uint32
  field :id, 4, type: :uint32
end

defmodule Pixels do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.14.0", syntax: :proto3

  field :pixels, 1, repeated: true, type: Pixel
end
