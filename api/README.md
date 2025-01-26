# Api

## How to deploy

- `docker build -t joshuawootonn/42colors --platform=linux/amd64 .`
- `docker push joshuawootonn/42colors`
- ... connect to server
- `docker stop $(docker ps -q --filter ancestor=joshuawootonn/42colors:latest )`
- `docker run --env-file ./.env.prod -p 4000:4000 --pull=always -d joshuawootonn/42colors:latest`

## How to migrate datebase

- `export $(xargs <.env.dev)`
- `mix clean`
- `mix compile`
- `mix phx.server`
  - just doing this to make sure it worked
- `mix ecto.migrate`
