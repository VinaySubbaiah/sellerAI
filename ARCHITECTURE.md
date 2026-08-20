# Architecture

SellerStudio AI is a pnpm monorepo:

```
apps/web      Next.js App Router PWA
apps/api      NestJS REST API
apps/worker   BullMQ generation worker
packages/shared  credits, schemas, readiness, errors
packages/ui      design-system primitives
packages/config  shared TypeScript config
```

```
Seller → Next.js PWA → NestJS API → PostgreSQL
                                 → Redis → BullMQ → Worker
                                 → S3 / local storage
Worker → Gemini or mock AI, Sharp, FFmpeg → stored assets
```

## Auth

Firebase ID tokens in production. Mock JWT (`AUTH_PROVIDER=mock`) for local/CI. Identity is always taken from the verified token.

## Credits

`CreditWallet.balance` plus an append-only `CreditLedger`. Jobs reserve credits, consume on success, refund on terminal failure. Idempotency keys prevent double grant/consume/refund.

## Generation

`POST /generation/jobs` validates ownership, prices from `CreditCostConfig`, reserves credits, creates `Project` + `GenerationJob`, enqueues BullMQ. If Redis is down the API processes the job inline so local demos still complete.

Product appearance is preserved by default: background extraction → original foreground → generated/empty scene → Sharp composite.

## Payments

Package amounts come from the database. Razorpay Checkout + signature verification + webhook, or `PAYMENT_PROVIDER=mock`.
