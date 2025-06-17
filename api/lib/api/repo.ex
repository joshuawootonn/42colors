defmodule Api.Repo do
  use Ecto.Repo,
    otp_app: :api,
    adapter: Ecto.Adapters.Postgres

  Postgrex.Types.define(
    Api.PostgresTypes,
    [Geo.PostGIS.Extension] ++ Ecto.Adapters.Postgres.extensions(),
    json: Jason
  )
end
