# Local setup

This is the shortest path to run SellerStudio AI on your laptop.

## Mock mode (default)

No Firebase, Gemini, Razorpay, or AWS keys required.

```bash
pnpm install
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/worker/.env
cp .env.example apps/web/.env.local

docker compose up -d postgres redis

pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm dev
```

Open:

- App: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs

Sign up with any email and an 8+ character password. You receive 4 credits once.

## Without Docker

Install PostgreSQL 16, Redis 7, and FFmpeg yourself. Create database user/database matching `DATABASE_URL` in `.env.example`, then run the same `pnpm` commands above.

```text
DATABASE_URL=postgresql://sellerstudio:sellerstudio@localhost:5432/sellerstudio
REDIS_URL=redis://127.0.0.1:6379
```

## Three-terminal alternative

```bash
pnpm dev:api      # :3001
pnpm dev:worker   # jobs
pnpm dev:web      # :3000
```

API and worker must share the same `DATABASE_URL`, `REDIS_URL`, and `STORAGE_LOCAL_DIR`. The default `STORAGE_LOCAL_DIR=storage` is resolved from the repo root.

## Demo accounts after seed

Mock login uses the email as identity (`mock:{email}`).

- Seller: `demo@sellerstudio.ai` (any 8+ character password)
- Admin: `admin@sellerstudio.ai` (open `/app/admin` after login)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `health` shows db/redis error | Start Postgres/Redis; check `DATABASE_URL` / `REDIS_URL` |
| Uploaded images missing during generation | Use the same `STORAGE_LOCAL_DIR` for API and worker; default is repo `storage/` |
| `Insufficient credits` | Buy the Starter pack on `/app/billing` (mock checkout) or seed more credits |
| Port 3000/3001 in use | Stop the old process or change `API_PORT` / Next port |
| Prisma client missing | `pnpm db:generate` |
| Reels fail | Install FFmpeg and confirm `ffmpeg` is on PATH |

See [README.md](README.md) for Firebase / Gemini / Razorpay / S3 configuration.
