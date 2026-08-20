# SellerStudio AI

AI-powered e-commerce content creation for Amazon, Flipkart, Meesho, Shopify and Instagram sellers.

**Upload Once. Sell Everywhere.**

Phase 1 turns 1–5 ordinary product photographs into marketplace listings, product images, marketing creatives and simple photo reels — without a photographer or a full video editor.

---

## Run locally (quick start)

You can run the full app on your machine with **mock auth, mock AI, mock payments, and local disk storage**. No Firebase, Gemini, Razorpay, or AWS keys are required for this mode.

### 1. Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker (recommended) **or** PostgreSQL 16 + Redis 7 installed locally
- FFmpeg (needed for animated reels)

### 2. Install

```bash
git clone https://github.com/VinaySubbaiah/sellerAI.git
cd sellerAI
pnpm install
```

### 3. Environment files

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/worker/.env
cp .env.example apps/web/.env.local
```

Leave these defaults for local mock mode:

```text
AUTH_PROVIDER=mock
NEXT_PUBLIC_AUTH_PROVIDER=mock
AI_PROVIDER=mock
PAYMENT_PROVIDER=mock
NEXT_PUBLIC_PAYMENT_PROVIDER=mock
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=storage
DATABASE_URL=postgresql://sellerstudio:sellerstudio@localhost:5432/sellerstudio
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Postgres + Redis

**Option A — Docker (recommended)**

```bash
docker compose up -d postgres redis
```

**Option B — already installed locally**

```bash
# macOS (Homebrew)
brew services start postgresql@16
brew services start redis

# create the database once
createdb sellerstudio || true
```

Linux example:

```bash
sudo -u postgres createuser -P sellerstudio   # password: sellerstudio
sudo -u postgres createdb -O sellerstudio sellerstudio
redis-server --daemonize yes
```

MinIO in `docker compose` is optional. Local mode uses the `storage/` folder instead of S3.

### 5. Database migrate + seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seed creates credit packages, help FAQs, demo user `demo@sellerstudio.ai`, and admin `admin@sellerstudio.ai`.

### 6. Start the app

From the repo root:

```bash
pnpm dev
```

That starts:

| Process | URL |
| --- | --- |
| Web (Next.js PWA) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001 |
| Swagger docs | http://localhost:3001/docs |
| Worker (BullMQ) | background jobs |

Or start them separately in three terminals:

```bash
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

### 7. Log in (mock auth)

1. Open http://localhost:3000
2. **Start Free** / **Signup**
3. Use any name, email, and password (at least 8 characters)
4. Accept Terms
5. New accounts receive **4 credits once**

Mock Google signup is available on the signup page in mock mode.

Forgot-password is a local confirmation screen until Firebase is enabled.

### 8. Stop

```bash
# if using Docker
docker compose down
```

Stop the `pnpm dev` processes with Ctrl+C.

---

## Local checks

```bash
# unit + API tests
pnpm test

# Playwright (app must already be running on :3000)
pnpm --filter @sellerstudio/web exec playwright install chromium
pnpm test:e2e

# types
pnpm typecheck
```

Health: http://localhost:3001/health should return `"status":"ok"`.

---

## Optional: real services later

Keep mock mode until each service is configured. Put secrets only in backend `.env` files, never in `NEXT_PUBLIC_*` except the public keys listed below.

### Firebase (Google + email/password)

Set `AUTH_PROVIDER=firebase` and `NEXT_PUBLIC_AUTH_PROVIDER=firebase`.

Backend:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Frontend:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Enable Email/Password and Google in the Firebase console. The API verifies ID tokens and never trusts a user id from the request body.

### Gemini

Set `AI_PROVIDER=gemini` and `GEMINI_API_KEY`.

- `TEXT_MODEL` (default `gemini-3.7-flash`)
- `IMAGE_MODEL` / `PREMIUM_IMAGE_MODEL` (default `gemini-3.1-flash-lite-image`)

### Razorpay (test mode)

Set `PAYMENT_PROVIDER=razorpay` and `NEXT_PUBLIC_PAYMENT_PROVIDER=razorpay`.

- Backend: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Frontend: `NEXT_PUBLIC_RAZORPAY_KEY_ID` (key id only)

Webhook: `POST /payments/webhook`. Duplicate webhooks do not grant credits twice.

### S3 / MinIO

Set `STORAGE_PROVIDER=s3` plus `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Use `S3_FORCE_PATH_STYLE=true` for MinIO.

```bash
docker compose up -d minio minio-init
```

Full variable list: [ENVIRONMENT.md](ENVIRONMENT.md). Architecture: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Deployment

1. Provision Postgres, Redis and S3-compatible storage.
2. Set production environment variables (see `ENVIRONMENT.md`).
3. `pnpm build`
4. Run `apps/api` (`node dist/main.js`), `apps/worker` (`pnpm --filter @sellerstudio/worker exec tsx src/main.ts` or equivalent), and `apps/web` (`next start`).
5. Put TLS in front of the API and web app. Restrict CORS to your web origin.

---

## Background removal license

Default `BG_REMOVAL_PROVIDER=heuristic` is original SellerStudio code (repository license). It is commercial-safe.

Do **not** add AGPL cutout libraries without a license review. For production matting, point `BG_REMOVAL_PROVIDER=http` at a service you operate under a compatible license.
