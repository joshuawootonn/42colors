# Api

## How to deploy

- `docker build -t joshuawootonn/42colors --platform=linux/amd64 .`
- `docker push joshuawootonn/42colors`
- ... connect to server
- `docker stop $(docker ps -q --filter ancestor=joshuawootonn/42colors:latest )`
- `docker run --env-file ./.env.prod -p 4000:4000 --pull=always -d joshuawootonn/42colors:latest`
