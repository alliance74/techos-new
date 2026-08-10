# Local infrastructure (Docker)

TechOS backend depends on Postgres, Redis, and a local mail catcher. Start them with Docker instead of installing each service by hand.

## Quick start

```bash
cd server-nest
cp .env.example .env   # if needed
npm install
npm run docker:up      # postgres + redis + mailhog
npm run start:dev      # Nest API on :4000
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Postgres | `5433` → container `5432` | Primary database |
| Redis | `6380` → container `6379` | Cache / queues |
| Mailhog SMTP | `1025` | Local email |
| Mailhog UI | [http://localhost:8025](http://localhost:8025) | View captured mail |

> Host ports default to **5433** / **6380** so they don’t collide with other local stacks on 5432/6379. Override with `POSTGRES_PORT` / `REDIS_PORT` in `.env` if you prefer.

### Optional profiles

```bash
npm run docker:tools     # Redis Commander → http://localhost:8081
npm run docker:storage   # MinIO → API :9000, console :9001
npm run docker:app       # Also run Nest inside Docker
npm run docker:down      # Stop containers
npm run docker:reset     # Stop + wipe volumes
```

## Database modes

`.env` defaults to Docker Postgres:

```env
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=techos
DATABASE_PASSWORD=techos
DATABASE_NAME=techos
```

To fall back to SQLite (no Docker DB):

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./techos.db
```

Redis from the host app should use the mapped port:

```env
REDIS_HOST=localhost
REDIS_PORT=6380
```

## Notes

- Keep Nest running on the host with `start:dev` for hot reload; only infra runs in Docker.
- Use `docker compose --profile app up -d --build` when you want the API containerized too.
