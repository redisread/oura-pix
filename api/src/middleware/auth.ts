/**
 * Authentication Middleware for Hono
 *
 * Validates Better Auth sessions and attaches user to context
 */

import { createMiddleware } from "hono/factory";
import { type User as DBUser, type Session as DBSession } from "@oura-pix/database";
import { createAuth, getSessionTokenFromHeaders } from "../lib/auth";
import { apiMessage } from "../lib/i18n";

export interface AuthContext {
  user: DBUser;
  session: DBSession;
}

/**
 * Authentication middleware
 *
 * Validates the Authorization header or cookie and attaches user to context
 */
export const authMiddleware = createMiddleware<{
  Variables: AuthContext;
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
}>(async (c, next) => {
  try {
    const env = c.env;
    const auth = createAuth(env, c.req.url);
    const sessionToken = getSessionTokenFromHeaders(new Headers(c.req.header()));

    if (!sessionToken) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: apiMessage(c, "unauthorized"),
          },
        },
        401
      );
    }

    // Validate session using Better Auth API
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${sessionToken}`,
      }),
    });

    if (!session?.user?.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: apiMessage(c, "unauthorized"),
          },
        },
        401
      );
    }

    // Attach user and session to context
    // Type assertion to handle minor differences between Better Auth and DB types
    c.set("user", session.user as DBUser);
    c.set("session", session.session as DBSession);

    await next();
  } catch (error) {
    console.error("[Auth Middleware] Error:", error);
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: apiMessage(c, "unauthorized"),
        },
      },
      401
    );
  }
});

/**
 * Optional auth middleware - doesn't fail if no auth, but attaches user if present
 */
export const optionalAuthMiddleware = createMiddleware<{
  Variables: Partial<AuthContext>;
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
}>(async (c, next) => {
  try {
    const env = c.env;
    const auth = createAuth(env, c.req.url);
    const sessionToken = getSessionTokenFromHeaders(new Headers(c.req.header()));

    if (sessionToken) {
      const session = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken}`,
        }),
      });

      if (session?.user?.id) {
        c.set("user", session.user as DBUser);
        c.set("session", session.session as DBSession);
      }
    }
  } catch (error) {
    console.error("[Optional Auth Middleware] Error:", error);
  }

  await next();
});

/**
 * Helper to get current user from context
 */
export function getUser(c: { get: (key: string) => unknown }) {
  return c.get("user") as AuthContext["user"] | undefined;
}
