## 1. Environment Setup

- [x] 1.1 Verify `.dev.vars` exists with required secrets — Created `apps/api/.dev.vars`
- [x] 1.2 Apply local D1 migrations — All 6 migrations applied
- [x] 1.3 Verify D1 tables exist — Confirmed (user, account, session, verificationToken)
- [x] 1.4 Verify D1 bindings in wrangler configs — Confirmed

## 2. Start Dev Servers

- [x] 2.1 Start API dev server on port 8989 — Running (wrangler dev)
- [x] 2.2 Verify API health — Sign-in returns 200 with proper error response
- [x] 2.3 Start web dev server on port 4001 — Running (Next.js, restored from git b24537f)
- [x] 2.4 Verify web serves login page — GET /login returns HTML 200

## 3. Debug Registration Flow

- [x] 3.1 Open `/register` page — Page accessible at http://localhost:4001/register
- [x] 3.2 Submit registration — API creates user + session, returns token
- [x] 3.3 Verify API processes sign-up — Confirmed via curl full flow
- [x] 3.4 Verify user in D1 — Confirmed via SQLite query
- [x] 3.5 Verify session cookie — `better-auth.session_token`, Secure flag stripped, SameSite=Lax
- [x] 3.6 Fix issues discovered — See "修复记录" below

## 4. Debug Login Flow

- [x] 4.1 Open `/login` page — Page accessible at http://localhost:4001/login
- [x] 4.2 Submit login — API validates, returns session + cookie
- [x] 4.3 Verify credentials validation — Correct password succeeds, wrong fails
- [x] 4.4 Verify session cookie — Cookie set, accepted by protected routes
- [x] 4.5 Test wrong password — Returns `INVALID_EMAIL_OR_PASSWORD`
- [x] 4.6 Fix issues discovered — See "修复记录" below

## 5. Debug Session Persistence and Protected Routes

- [x] 5.1 Navigate to protected page — `/api/generations` returns 200 with session
- [x] 5.2 Verify `/api/auth/session` returns user data — Full session + user returned
- [x] 5.3 Verify protected routes accept cookie — Confirmed
- [x] 5.4 Test sign-out — Clears cookies, subsequent requests return 401
- [x] 5.5 Fix issues discovered — All fixed
