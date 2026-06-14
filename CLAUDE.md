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
│   └── database/
├── db/               # older migration path
├── drizzle/          # current root migrations
├── i18n/messages/    # en / zh messages
├── docs/
└── wrangler.jsonc    # root Cloudflare/OpenNext-style config
```

Important: root `wrangler.jsonc` references `.open-next/worker.js`, while `frontend/` is currently Astro. Before deployment work, inspect the active workflow and output directory instead of assuming one frontend architecture.

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
pnpm --filter=api test
pnpm --filter=api lint
```

Frontend:

```bash
pnpm web:dev
pnpm web:preview
pnpm web:deploy
pnpm --filter=frontend build
pnpm --filter=frontend lint
```

## Cloudflare Resources

- API worker: `oura-pix-api`
- Main app config: root `wrangler.jsonc`
- API config: `api/wrangler.jsonc`
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
- Confirm whether `db/migrations/` is legacy before adding new migrations there.
- Production database migrations require explicit human authorization.

## i18n

- Message files live in `i18n/messages/en.json` and `i18n/messages/zh.json`.
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
pnpm --filter=api lint
pnpm --filter=api test
```

For frontend changes, run at least:

```bash
pnpm --filter=frontend build
pnpm --filter=frontend lint
```

For cross-package changes, run:

```bash
pnpm build
pnpm lint
```

## Known Gotchas

- Do not trust old product/architecture prose without checking current package files.
- Root OpenNext config and `frontend/` Astro package can diverge; verify before deployment.
- `frontend` typecheck currently uses `tsc --noEmit || true`; do not treat it as a strict gate unless changed.
- Sensitive payment, OAuth, Gemini, and auth secrets must never be pasted into public chat, docs, or commits.
- This repo has custom `.claude/skills` and `.claude/commands`; prefer those workflows when working on OpenSpec / Spec Kit tasks.

Keep this file under 200 lines. Move product strategy, API reference, and long examples to `docs/` or path-scoped `.claude/rules/`.
