/**
 * User Routes
 *
 * Handles user profile updates via Better Auth
 */

import { badRequest, unauthorized } from "../lib/http";
import { createAuth, getSessionTokenFromHeaders } from "../lib/auth";
import type { Context } from "hono";
import { Hono } from "hono";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
}>();

router.onError((err, c) => {
  console.error("[API] User route error:", err);
  return c.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    },
    500
  );
});

function badReq(c: Context) {
  return badRequest(c);
}

function unauth(c: Context) {
  return unauthorized(c);
}

// Update user profile (name)
router.put("/profile", async (c) => {
  const auth = createAuth(c.env, c.req.url);
  const body = await c.req.json();

  const { name } = body as { name?: string };

  if (!name || name.trim().length === 0) return badReq(c);

  const sessionToken = getSessionTokenFromHeaders(new Headers(c.req.header()));
  if (!sessionToken) return unauth(c);

  const result = await auth.api.updateUser({
    headers: new Headers({
      cookie: `better-auth.session_token=${sessionToken}`,
    }),
    body: { name: name.trim() },
  });

  return c.json({ success: true, data: result });
});

// Update user avatar/image
router.put("/avatar", async (c) => {
  const auth = createAuth(c.env, c.req.url);
  const body = await c.req.json();

  const { image } = body as { image?: string };

  if (!image) return badReq(c);

  const sessionToken = getSessionTokenFromHeaders(new Headers(c.req.header()));
  if (!sessionToken) return unauth(c);

  const result = await auth.api.updateUser({
    headers: new Headers({
      cookie: `better-auth.session_token=${sessionToken}`,
    }),
    body: { image },
  });

  return c.json({ success: true, data: result });
});

export default router;
