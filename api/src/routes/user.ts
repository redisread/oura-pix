/**
 * User Routes
 *
 * Handles user profile updates via Better Auth
 */

import { Hono } from "hono";
import { createAuth, getSessionTokenFromHeaders } from "../lib/auth";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
}>();

// Update user profile (name)
router.put("/profile", async (c) => {
  const auth = createAuth(c.env, c.req.url);
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
    const sessionToken = getSessionTokenFromHeaders(new Headers(c.req.header()));
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
  const auth = createAuth(c.env, c.req.url);
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
    const sessionToken = getSessionTokenFromHeaders(new Headers(c.req.header()));
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

export default router;
