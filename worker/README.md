# AcademicChain Ledger Worker API

This is the Cloudflare Worker that serves as the backend API for AcademicChain Ledger. It uses **Hono** framework and connects to **D1** (Database) and **R2** (Storage).

## Prerequisites

1.  **Enable R2**: Go to your Cloudflare Dashboard > R2 and enable the plan (requires a payment method, even for free tier).
2.  **Create Bucket**: Run `npx wrangler r2 bucket create academic-storage`.
3.  **D1 Database**: The database `academic-db` is already created.

## Development

```bash
cd worker
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```

## Structure

- `src/index.ts`: Main entry point and routes.
- `wrangler.toml`: Configuration and bindings.

## Bindings

- **DB**: D1 Database (`academic-db`)
- **BUCKET**: R2 Storage (`academic-storage`)
