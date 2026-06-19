/**
 * Authentication Routes
 *
 * Handles sign-in, sign-up, sign-out, session, and password management
 */

import { Hono } from "hono";
import { createAuth, normalizeLocalSetCookie } from "../lib/auth";

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
  const auth = createAuth(c.env, c.req.url);

  // Get raw body text
  const bodyText = await c.req.text();

  // Rewrite path to match Better Auth's expected endpoint
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace("/sign-in", "/sign-in/email");

  // Build headers properly - Hono's req.header() returns a Headers object
  const rawHeaders = c.req.header();
  const headers = rawHeaders instanceof Headers ? rawHeaders : new Headers(rawHeaders);

  const request = new Request(url.toString(), {
    method: "POST",
    headers,
    body: bodyText || undefined,
  });

  const response = await auth.handler(request);

  // Copy Set-Cookie header if present
  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    // For local development: strip Secure flag from cookies to allow HTTP
    const normalizedCookie = normalizeLocalSetCookie(setCookie, c.req.url);
    if (normalizedCookie) c.header("Set-Cookie", normalizedCookie);
  }

  // Handle response - read response body first
  const text = await response.text();

  const data = text ? JSON.parse(text) : { success: true, status: response.status };
  return c.json(data, response.status as never);
});

// Sign up (maps to Better Auth's /sign-up/email endpoint)
router.post("/sign-up", async (c) => {
  const auth = createAuth(c.env, c.req.url);

  const bodyText = await c.req.text();

  // Rewrite path to match Better Auth's expected endpoint
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace("/sign-up", "/sign-up/email");

  // Build headers properly
  const rawHeaders = c.req.header();
  const headers = rawHeaders instanceof Headers ? rawHeaders : new Headers(rawHeaders);

  const request = new Request(url.toString(), {
    method: "POST",
    headers,
    body: bodyText || undefined,
  });

  const response = await auth.handler(request);

  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    // For local development: strip Secure flag from cookies to allow HTTP
    const normalizedCookie = normalizeLocalSetCookie(setCookie, c.req.url);
    if (normalizedCookie) c.header("Set-Cookie", normalizedCookie);
  }

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : { success: true };
  } catch {
    data = { success: false, error: "Invalid response" };
  }

  // Use 200 status code if Better Auth returns success
  const statusCode = response.status >= 200 && response.status < 300 ? response.status : 200;
  return c.json(data, statusCode as never);
});

// Sign out
router.post("/sign-out", async (c) => {
  // Check if running in local development (HTTP)
  const auth = createAuth(c.env, c.req.url);

  const url = new URL(c.req.url);
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.header(),
  });
  const response = await auth.handler(request);

  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    // For local development: strip Secure flag from cookies to allow HTTP
    const normalizedCookie = normalizeLocalSetCookie(setCookie, c.req.url);
    if (normalizedCookie) c.header("Set-Cookie", normalizedCookie);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : { success: true };
  return c.json(data, response.status as never);
});

// Get session
router.get("/session", async (c) => {
  const auth = createAuth(c.env, c.req.url);

  // Use the original request URL but ensure correct pathname
  const url = new URL(c.req.url);
  url.pathname = "/api/auth/get-session";

  // Forward all headers including cookies
  const headers = new Headers(c.req.header());

  const request = new Request(url.toString(), {
    method: "GET",
    headers,
  });

  const response = await auth.handler(request);

  const text = await response.text();

  const data = text ? JSON.parse(text) : { user: null, session: null };
  return c.json(data, response.status as never);
});

// Forgot password (maps to Better Auth's /request-password-reset endpoint)
router.post("/forgot-password", async (c) => {
  const auth = createAuth(c.env, c.req.url);
  const bodyText = await c.req.text();

  // Rewrite path to match Better Auth's expected endpoint
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace("/forgot-password", "/request-password-reset");

  // Build headers properly
  const rawHeaders = c.req.header();
  const headers = rawHeaders instanceof Headers ? rawHeaders : new Headers(rawHeaders);

  const request = new Request(url.toString(), {
    method: "POST",
    headers,
    body: bodyText || undefined,
  });
  const response = await auth.handler(request);

  const text = await response.text();
  const data = text ? JSON.parse(text) : { success: true };
  return c.json(data, response.status as never);
});

// Reset password
router.post("/reset-password", async (c) => {
  const auth = createAuth(c.env, c.req.url);
  const bodyText = await c.req.text();

  const url = new URL(c.req.url);
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.header(),
    body: bodyText || undefined,
  });
  const response = await auth.handler(request);

  const text = await response.text();
  const data = text ? JSON.parse(text) : { success: true };
  return c.json(data, response.status as never);
});

export { router as authRoutes };
