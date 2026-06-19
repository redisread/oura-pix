# OuraPix

## Project

OuraPix is an AI-assisted product detail page generator for cross-border e-commerce sellers. It analyzes product inputs and helps generate detail-page assets for platforms such as Amazon and Shopify.

## Current Repository Shape

This repo is a pnpm/turbo monorepo with Cloudflare deployment targets.

```text
oura-pix/
├── api/              # Hono + Cloudflare Workers API
├── frontend/         # Astro frontend package
├── packages/
│   ├── api-client/
│   ├── config/
│   └── database/
├── drizzle/          # current root migrations
├── docs/
└── pnpm-workspace.yaml
```

The frontend is Astro. API deployment uses `api/wrangler.jsonc`; frontend deployment uses `frontend/wrangler.toml`.

## Stack

- API: Hono, Cloudflare Workers, Better Auth, Drizzle ORM, D1, R2
- Frontend package: Astro 5, React 18, Tailwind CSS 4, Zustand
- Database package: Drizzle migrations and schema
- AI / payment integrations: Gemini, Stripe
- Tooling: pnpm 9, Turbo, TypeScript

Node version is read from root `package.json` engines (`>=18.0.0`) unless a workflow or package overrides it.

## Commands

```bash
pnpm install
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm build
pnpm lint
pnpm debug:check
pnpm debug:full
```

Database:

```bash
pnpm db:generate
pnpm db:migrate:local
pnpm db:migrate:prod
pnpm db:studio
```

API:

```bash
pnpm api:dev
pnpm api:deploy
pnpm --filter=@oura-pix/api test
pnpm --filter=@oura-pix/api lint
pnpm --filter=@oura-pix/api typecheck
```

Frontend:

```bash
pnpm web:dev
pnpm web:preview
pnpm web:deploy
pnpm --filter=@oura-pix/frontend build
pnpm --filter=@oura-pix/frontend lint
pnpm --filter=@oura-pix/frontend typecheck
```

## Cloudflare Resources

- API worker: `oura-pix-api`
- API config: `api/wrangler.jsonc`
- Frontend config: `frontend/wrangler.toml`
- D1 binding: `DB`
- D1 database: `oura-pix-db`
- R2 binding: `R2`
- R2 bucket: `oura-pix-r2`
- Public app URL: `https://ourapix.jiahongw.com`
- API URL: `https://api.ourapix.jiahongw.com`
- R2 public URL: `https://ourapix.cos.jiahongw.com`

Secrets must be managed with Cloudflare Secrets, not committed:

- `BETTER_AUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- OAuth provider IDs/secrets

## Data Rules

- Current migrations under `drizzle/migrations/` are the primary source for root deployment.
- `api/wrangler.jsonc` points migrations to `../../drizzle/migrations`.
- Drizzle schema lives in `packages/database/src/schema.ts`.
- Drizzle journal has been baselined to `drizzle/migrations/meta/0017_snapshot.json`; do not keep generated catch-up migrations that recreate existing tables.
- Production database migrations require explicit human authorization.

## i18n

- Message files live in `frontend/messages/`.
- `frontend` currently has an `i18n:build` mock script; verify the real i18n flow before large text changes.

## PR / Review Rules

Before merge, provide:

- changed scope and package
- commands run
- Cloudflare resources touched
- migration impact
- rollback notes

For API changes, run at least:

```bash
pnpm --filter=@oura-pix/api lint
pnpm --filter=@oura-pix/api test
```

For frontend changes, run at least:

```bash
pnpm --filter=@oura-pix/frontend build
pnpm --filter=@oura-pix/frontend lint
```

For cross-package changes, run:

```bash
pnpm build
pnpm lint
```

## Known Gotchas

- Do not trust old product/architecture prose without checking current package files.
- Frontend API calls should go through `frontend/src/lib/api.ts` so `PUBLIC_API_URL` is honored.
- `/api/v1/*` uses API key auth; `/api/webhooks/stripe` uses Stripe signature auth; do not place these behind session auth.
- Sensitive payment, OAuth, Gemini, and auth secrets must never be pasted into public chat, docs, or commits.
- This repo has custom `.claude/skills` and `.claude/commands`; prefer those workflows when working on OpenSpec / Spec Kit tasks.

Keep this file under 200 lines. Move product strategy, API reference, and long examples to `docs/` or path-scoped `.claude/rules/`.
