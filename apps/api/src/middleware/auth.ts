/**
 * Authentication Middleware for Hono
 *
 * Validates Better Auth sessions and attaches user to context
 */

import { createMiddleware } from "hono/factory";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema, type User as DBUser, type Session as DBSession } from "@oura-pix/database";

export interface AuthContext {
  user: DBUser;
  session: DBSession;
}

/**
 * Create Better Auth instance
 */
function createAuth(env: {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}) {
  const db = createDb(env.DB);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      camelCase: true,
      schema: {
        user: schema.users,
        account: schema.accounts,
        session: schema.sessions,
        verification: schema.verificationTokens,
      },
    }),
    session: {
      expiresIn: 604800, // 7 days
      updateAge: 86400, // 1 day
    },
  });
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
    const auth = createAuth(env);

    // Try to get token from Authorization header first (for mobile/API clients)
    let sessionToken = c.req.header("Authorization")?.replace("Bearer ", "");

    // Fallback to cookie (for web clients)
    if (!sessionToken) {
      const cookie = c.req.header("Cookie");
      if (cookie) {
        const match = cookie.match(/ourapix\.session=([^;]+)/);
        if (match) {
          sessionToken = match[1];
        }
      }
    }

    if (!sessionToken) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "No authentication token provided",
          },
        },
        401
      );
    }

    // Validate session using Better Auth API
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `ourapix.session=${sessionToken}`,
      }),
    });

    if (!session?.user?.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired session",
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
          message: "Authentication failed",
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
    const auth = createAuth(env);

    let sessionToken = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      const cookie = c.req.header("Cookie");
      if (cookie) {
        const match = cookie.match(/ourapix\.session=([^;]+)/);
        if (match) {
          sessionToken = match[1];
        }
      }
    }

    if (sessionToken) {
      const session = await auth.api.getSession({
        headers: new Headers({
          cookie: `ourapix.session=${sessionToken}`,
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
