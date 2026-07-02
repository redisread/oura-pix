/**
 * Authentication Routes
 *
 * Handles sign-in, sign-up, sign-out, session, and password management
 */

import { Hono } from "hono";
import { contextLocale } from "../lib/i18n";
import { forwardAuthRequest } from "../lib/auth";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    NEXT_PUBLIC_APP_URL?: string;
    FROM_EMAIL: string;
    FROM_NAME: string;
    RESEND_API_KEY: string;
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
    AUTH_GITHUB_ID?: string;
    AUTH_GITHUB_SECRET?: string;
  };
}>();

// Sign in (maps to Better Auth's /sign-in/email endpoint)
router.post("/sign-in", async (c) => {
  const { status, data } = await forwardAuthRequest(c, {
    pathnameRewrite: (p) => p.replace("/sign-in", "/sign-in/email"),
    forwardBody: true,
  });
  return c.json(data, status as never);
});

// Sign up (maps to Better Auth's /sign-up/email endpoint)
router.post("/sign-up", async (c) => {
  const response = await forwardAuthRequest(c, {
    pathnameRewrite: (p) => p.replace("/sign-up", "/sign-up/email"),
    forwardBody: true,
  });
  // Use 200 status code if Better Auth returns success
  const statusCode = response.status >= 200 && response.status < 300 ? response.status : 200;
  return c.json(response.data, statusCode as never);
});

// Sign out
router.post("/sign-out", async (c) => {
  const { status, data } = await forwardAuthRequest(c);
  return c.json(data, status as never);
});

// Get session
router.get("/session", async (c) => {
  const { status, data } = await forwardAuthRequest(c, {
    pathnameRewrite: "/api/auth/get-session",
  });
  return c.json(data, status as never);
});

// Forgot password (maps to Better Auth's /request-password-reset endpoint)
router.post("/forgot-password", async (c) => {
  const { status, data } = await forwardAuthRequest(c, {
    pathnameRewrite: (p) => p.replace("/forgot-password", "/request-password-reset"),
    forwardBody: true,
    locale: contextLocale(c),
  });
  return c.json(data, status as never);
});

// Reset password
router.post("/reset-password", async (c) => {
  const { status, data } = await forwardAuthRequest(c, {
    forwardBody: true,
  });
  return c.json(data, status as never);
});

export default router;
