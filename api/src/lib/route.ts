/**
 * Shared Hono context types and route factory.
 *
 * ~15 route files were each re-declaring the same
 * `{ Bindings: { DB: D1Database }, Variables: { user, session } }` type.
 * This module provides a single source of truth plus a factory that
 * lets routes add extra bindings without re-declaring the common shape.
 */

import { Hono } from "hono";
import { internalError } from "./http";
import { createDb } from "@oura-pix/database";

/**
 * Variables injected by the auth middleware. Mirrors `AuthVariables` semantics
 * but uses the lighter-weight shape that route handlers actually rely on.
 */
export interface AuthVariables {
  user: { id: string; email: string; name?: string | null };
  session: { id: string; expiresAt: Date };
}

/** Default bindings shared by every route. */
export interface DbBindings {
  DB: D1Database;
}

/**
 * Create a Hono router with the standard auth context pre-applied.
 *
 * Routes that need additional bindings pass them as a type argument:
 *
 * ```ts
 * const router = createRouter<{ R2: R2Bucket }>();
 * router.get("/", (c) => { c.env.R2... });
 * ```
 */
export function createRouter<
  Extra extends Record<string, unknown> = Record<never, never>,
>() {
  const app = new Hono<{
    Bindings: DbBindings & Extra;
    Variables: AuthVariables;
  }>();
  app.onError((err, c) => {
    console.error("[API] Unhandled error:", err);
    return internalError(c as never);
  });
  return app;
}

/**
 * Like `createRouter` but for the variables shape used by v1 routes
 * whose auth is API-key based rather than session-based.
 */
export function createApiKeyRouter<
  Extra extends Record<string, unknown> = Record<never, never>,
>() {
  const app = new Hono<{
    Bindings: DbBindings & Extra;
    Variables: {
      apiKey: { id: string; userId: string; name: string };
      apiKeyUser: { id: string; email: string };
      locale?: import("./i18n").Locale;
    };
  }>();
  app.onError((err, c) => {
    console.error("[API] Unhandled error:", err);
    return internalError(c as never);
  });
  return app;
}

/**
 * Extract the authenticated user and a fresh DB instance in one call.
 *
 * Replaces the repeated two-line pattern:
 * ```
 * const user = getAuthUser(c);
 * const db = createDb(c.env.DB);
 * ```
 *
 * Usage:
 * ```
 * router.get("/", (c) => {
 *   const { user, db } = useCtx(c);
 *   // ...
 * });
 * ```
 */
export function useCtx<
  E extends Record<string, unknown> = Record<never, never>,
>(c: {
  env: DbBindings & E;
  get: (key: string) => unknown;
}): {
  user: AuthVariables["user"];
  db: ReturnType<typeof createDb>;
} {
  return {
    user: c.get("user") as AuthVariables["user"],
    db: createDb(c.env.DB),
  };
}
