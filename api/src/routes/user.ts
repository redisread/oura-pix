/**
 * User Routes
 *
 * Handles user profile updates via Better Auth
 */

import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "@oura-pix/database";
import { authMiddleware } from "../middleware/auth";

/**
 * Create Better Auth instance for user routes
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
      expiresIn: 604800,
      updateAge: 86400,
    },
  });
}

/**
 * Helper to extract session token from request
 */
function getSessionToken(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const cookie = c.req.header("Cookie");
  if (cookie) {
    const match = cookie.match(/better-auth\.session_token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
}>();

// Apply auth middleware to all routes
router.use("*", authMiddleware);

// Update user profile (name)
router.put("/profile", async (c) => {
  const auth = createAuth(c.env);
  const body = await c.req.json();

  const { name } = body as { name?: string };

  if (!name || name.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Name is required" },
      },
      400
    );
  }

  try {
    const sessionToken = getSessionToken(c);
    if (!sessionToken) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "No session" },
        },
        401
      );
    }

    const result = await auth.api.updateUser({
      headers: new Headers({
        cookie: `better-auth.session_token=${sessionToken}`,
      }),
      body: { name: name.trim() },
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("[User Profile Update] Error:", error);
    return c.json(
      {
        success: false,
        error: { code: "UPDATE_FAILED", message: "Failed to update profile" },
      },
      500
    );
  }
});

// Update user avatar/image
router.put("/avatar", async (c) => {
  const auth = createAuth(c.env);
  const body = await c.req.json();

  const { image } = body as { image?: string };

  if (!image) {
    return c.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Image URL is required" },
      },
      400
    );
  }

  try {
    const sessionToken = getSessionToken(c);
    if (!sessionToken) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "No session" },
        },
        401
      );
    }

    const result = await auth.api.updateUser({
      headers: new Headers({
        cookie: `better-auth.session_token=${sessionToken}`,
      }),
      body: { image },
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("[Avatar Update] Error:", error);
    return c.json(
      {
        success: false,
        error: { code: "UPDATE_FAILED", message: "Failed to update avatar" },
      },
      500
    );
  }
});

export { router as userRoutes };
