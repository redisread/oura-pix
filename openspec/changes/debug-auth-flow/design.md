## Context

The project is a monorepo with an API backend (Hono + Better Auth on Cloudflare Workers, port 8989) and a web frontend (Astro, port 4545). Authentication uses Better Auth with a Drizzle adapter backed by a local D1 database (SQLite). The auth flow involves sign-up, sign-in, session management, and password reset.

Current state:
- API routes exist at `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/sign-out`, `/api/auth/session`
- The API proxies requests to Better Auth's internal endpoints (e.g., `/sign-in/email`)
- Cookie-based sessions (`ourapix.session`) for web clients, Bearer tokens for API clients
- Local dev requires D1 migrations to be applied first
- `.dev.vars` holds local secrets (BETTER_AUTH_SECRET, etc.)

Potential issues to debug:
1. D1 database tables may not exist (migrations not applied locally)
2. CORS or cookie issues between frontend (port 4545) and API (port 8989)
3. Missing or misconfigured environment variables
4. Frontend form submission pointing to wrong API URLs
5. Cookie `Secure` flag stripping for local HTTP dev

## Goals / Non-Goals

**Goals:**
- Get both API and web dev servers running simultaneously
- Successfully register a new user via the frontend and verify D1 persistence
- Successfully log in and verify session cookie creation and propagation
- Identify and fix any issues blocking the auth flow

**Non-Goals:**
- OAuth/social login (email/password only for now)
- Email verification flow
- Production deployment debugging
- Subscription/payment flow

## Decisions

### Decision 1: Use `pnpm debug:full` or manual concurrent startup
The root `package.json` already has a `debug:full` script that runs DB migrations and starts both servers. We'll use this as the primary approach, but also support manual independent startup for targeted debugging.

**Alternative considered**: Use `turbo` with parallel filters — already what `debug:full` does, so no change needed.

### Decision 2: Local D1 database state
Before testing, ensure the D1 database has all tables. Run `npx wrangler d1 migrations apply DB --local` to create the schema. If tables already exist from a previous run, this is safe (SQLite migrations are idempotent for Drizzle).

### Decision 3: API URL configuration for frontend
The frontend at port 4545 needs to know the API is at `http://localhost:8989`. This is configured via `NEXT_PUBLIC_APP_URL` or similar env var. We'll verify the frontend API client points to the correct backend URL.

### Decision 4: Cookie handling across ports
Cookies set by the API (port 8989) need to be sent back from the frontend (port 4545). Since these are different ports on the same host, cookies should work if:
- `SameSite` is set to `Lax` or `None`
- `Secure` flag is stripped for HTTP (already handled in auth.ts)
- Frontend makes requests with `credentials: 'include'`

## Risks / Trade-offs

- [Cookie cross-origin issue] → The frontend and API are on different ports. If the API sets cookies with `Domain` restrictions or if the frontend uses CORS fetch without credentials, cookies won't propagate. Mitigation: verify `credentials: 'include'` in API client and check cookie attributes.
- [D1 local state corruption] → Local D1 uses SQLite files that can get stale. Mitigation: provide instructions to wipe `.wrangler/state/` and re-migrate.
- [Better Auth baseURL mismatch] → The `createAuth` function defaults to `localhost:8787` for local dev, but the API runs on `8989`. This could cause redirect/callback URL mismatches. Mitigation: the code already uses `baseUrlOverride` from the request URL, which should handle this.
