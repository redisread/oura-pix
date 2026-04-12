## Why

The registration and login flow (sign-up / sign-in) has not been tested end-to-end in the local development environment. Both the API (Hono + Better Auth on Cloudflare Workers) and the web frontend (Astro) need to be running simultaneously with proper D1 database migrations applied so that the full auth flow can be manually verified and any issues fixed.

## What Changes

- Start API dev server (`wrangler dev --port 8989`) and web dev server (`astro dev --port 4545`) concurrently
- Apply local D1 database migrations before starting servers
- Test the full registration flow: sign-up form → API → D1 user creation → response
- Test the full login flow: sign-in form → API → session creation → cookie/token → protected route access
- Identify and fix any issues discovered during testing (CORS, env vars, API routing, frontend form submission, etc.)

## Capabilities

### New Capabilities
- `local-auth-debug`: Local development environment setup and debugging workflow for the authentication flow

### Modified Capabilities
- *(none)*

## Impact

- `apps/api/src/routes/auth.ts` — auth endpoint handlers may need fixes
- `apps/api/src/middleware/auth.ts` — session validation middleware may need adjustments
- `apps/api/wrangler.jsonc` / `apps/web/wrangler.jsonc` — local D1 bindings and env vars
- `apps/web/` — frontend auth forms and API client integration
- `packages/api-client/` — shared API client types and endpoints
- `.dev.vars` — local environment variables for Better Auth secret and API keys
