recipe-name:
  @just --list

db-down:
  @docker compose --project-directory ./docker down 
db-up:
  @docker compose --project-directory ./docker up -d
