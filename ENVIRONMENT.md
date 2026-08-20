# Environment variables

Copy `.env.example` to `.env`, `apps/api/.env`, `apps/worker/.env`, and `apps/web/.env.local`.

Never commit real secrets.

## Local mock defaults (no vendor keys)

| Variable | Example | Notes |
| --- | --- | --- |
| `AUTH_PROVIDER` | `mock` | Use `firebase` in production |
| `NEXT_PUBLIC_AUTH_PROVIDER` | `mock` | Must match backend |
| `AI_PROVIDER` | `mock` | Use `gemini` when you have a key |
| `PAYMENT_PROVIDER` | `mock` | Use `razorpay` in test/live |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | `mock` | Must match backend |
| `STORAGE_PROVIDER` | `local` | Use `s3` for MinIO/AWS |
| `STORAGE_LOCAL_DIR` | `storage` | Shared folder at repo root |
| `DATABASE_URL` | `postgresql://sellerstudio:sellerstudio@localhost:5432/sellerstudio` | |
| `REDIS_URL` | `redis://127.0.0.1:6379` | |
| `AUTH_JWT_SECRET` | long random string | Mock JWT only |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Browser → API |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | |

## Production / optional keys

| Variable | Type | Where |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | Project id | API |
| `FIREBASE_CLIENT_EMAIL` | Service-account email | API |
| `FIREBASE_PRIVATE_KEY` | **Secret** PEM | API |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public web key | Web |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `*.firebaseapp.com` | Web |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project id | Web |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App id | Web |
| `GEMINI_API_KEY` | **Secret** | API + worker |
| `TEXT_MODEL` / `IMAGE_MODEL` / `PREMIUM_IMAGE_MODEL` | Model ids | API + worker |
| `RAZORPAY_KEY_ID` | `rzp_test_…` / `rzp_live_…` | API |
| `RAZORPAY_KEY_SECRET` | **Secret** | API |
| `RAZORPAY_WEBHOOK_SECRET` | **Secret** | API |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key id (public) | Web |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Access keys | API + worker |
| `S3_BUCKET` / `S3_REGION` / `S3_ENDPOINT` | Bucket config | API + worker |

Frontend only needs `NEXT_PUBLIC_*` values. Razorpay secrets, Gemini, Firebase Admin, and S3 secrets stay on the API/worker.
