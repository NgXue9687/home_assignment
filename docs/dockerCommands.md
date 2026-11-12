# Docker commands

Run every command from the repository root (`D:\HTX`), where `docker-compose.yml` is.

## Start and stop

| Command | What it does |
|---|---|
| `docker compose up --build` | Build the images and start everything (database, backend, frontend). Open http://localhost:4000 |
| `docker compose up -d --build` | Same, in the background |
| `docker compose ps` | List the containers and their status (`htx-db` should show `healthy`) |
| `docker compose down` | Stop and remove the containers. **The database data is kept** |

## Logs

| Command | What it does |
|---|---|
| `docker compose logs -f backend` | Follow the backend log (LLM warnings, errors) |
| `docker compose logs -f frontend` | Follow the nginx log |
| `docker compose logs postgresql` | Database log, including the init scripts |

## Reset the database (re-run the init scripts)

The scripts in `containers/postgresql/docker-entrypoint-initdb.d` only run when the database volume is **empty**. After changing them, delete the volume so they run again.

> **Warning:** this deletes everything in the database, including every task created. Only the seed data comes back.

### Reset everything

```powershell
docker compose down -v
docker compose up --build
```

`down -v` stops the containers **and removes the volumes** (`pgdata`). On the next start, Postgres finds an empty volume and runs the scripts in order: `001_…`, `002_…`, `100_…`, `101_…`, `102_…`, `901_…`.

### Reset only the database

```powershell
docker compose stop postgresql
docker compose rm -f postgresql
docker volume ls                  # find the volume, e.g. htx_pgdata
docker volume rm htx_pgdata
docker compose up -d postgresql
```

Compose names volumes `<project>_<volume>`; the project name is the folder name in lowercase (`htx`). Check the exact name with `docker volume ls`.

### Check that the scripts ran

```powershell
docker compose logs postgresql | Select-String "docker-entrypoint-initdb.d"
```

There should be one `running /docker-entrypoint-initdb.d/…sql` line per script. If a script fails, its error appears right after that line and Postgres stops: fix the SQL and reset again.

## What to run after a change

| You changed… | Run |
|---|---|
| SQL init or seed scripts | `docker compose down -v`, then `docker compose up --build` |
| Backend or frontend code, a `Dockerfile`, or `nginx.conf` | `docker compose up --build` (no volume reset needed) |
| Only `webapp/.env` | `docker compose up -d --force-recreate backend` |
