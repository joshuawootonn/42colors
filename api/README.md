# Api

## How to deploy with Kamal

- `kamal app stop`
  - This is only necessary if you are running on a 4gb machine
- `export $(xargs <.env.prod) && mix deps.get --only prod && MIX_ENV=prod mix compile && kamal deploy`

## How to manually deploy

Only do this if something goes really wrong with Kamal

- `docker build -t joshuawootonn/42colors --platform=linux/amd64 .`
- `docker push joshuawootonn/42colors`
- ... connect to server
- `docker stop $(docker ps -q --filter ancestor=joshuawootonn/42colors:latest )`
- `docker run --env-file ./.env.prod -p 4000:4000 --pull=always -d joshuawootonn/42colors:latest`

## How to migrate database

- `export $(xargs <.env.dev)`
- `mix clean`
- `mix compile`
- `mix phx.server`
  - just doing this to make sure it worked
- `mix ecto.migrate`

## How I added a volume in and setup auto mounting

- https://docs.digitalocean.com/products/volumes/how-to/mount/

# Provision a new server

For these examples I'm changing the default SSH port to be 7777

## Enable firewall

- `sudo ufw default deny incoming`
- `sudo ufw default allow outgoing`
- `sudo ufw allow 7777`
- `sudo ufw allow 7777/tcp`
- `sudo ufw show added`
- `sudo ufw enable`

## Change default ssh port

- `sudo vim /etc/ssh/sshd_config`
- Uncomment the `#Port 22` and change it to be `Port 7777`
- `sudo systemctl restart ssh`
- `systemctl daemon-reload`
- `systemctl restart ssh.socket`
