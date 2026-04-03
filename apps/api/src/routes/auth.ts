/**
 * Authentication Routes
 *
 * Handles sign-in, sign-up, sign-out, session, and password management
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "@oura-pix/database";
import { sendPasswordResetEmail } from "../lib/mail";

// Create Better Auth instance for routes
function createAuth(
  env: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    FROM_EMAIL: string;
    FROM_NAME: string;
    NEXT_PUBLIC_APP_URL?: string;
    RESEND_API_KEY: string;
  },
  isLocalDevOverride?: boolean,
  baseUrlOverride?: string
) {
  const db = createDb(env.DB);

  // Check if running in local development (HTTP)
  const isLocalDev = isLocalDevOverride ??
    (env.BETTER_AUTH_URL.startsWith("http://localhost") ||
      env.BETTER_AUTH_URL.startsWith("http://127.0.0.1"));

  // Use override URL if provided, otherwise determine from local dev status
  // For local dev, default to localhost:8787 if not specified
  const baseURL = baseUrlOverride ||
    (isLocalDev ? "http://localhost:8787" : env.BETTER_AUTH_URL);

  return betterAuth({
    baseURL: baseURL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      env.BETTER_AUTH_URL,
      env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL,
      "http://localhost:4001",
      "http://localhost:8787",
    ],
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
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail(
          { email: user.email, name: user.name || undefined },
          { resetUrl: url, userName: user.name || user.email },
          env
        );
      },
    },
    session: {
      expiresIn: 604800,
      updateAge: 86400,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    // Use non-secure cookies for local development (HTTP)
    advanced: {
      disableCSRFCheck: isLocalDev,
      useSecureCookies: !isLocalDev,
    },
  });
}

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    NEXT_PUBLIC_APP_URL?: string;
    FROM_EMAIL: string;
    FROM_NAME: string;
    RESEND_API_KEY: string;
  };
}>();

// Sign in (maps to Better Auth's /sign-in/email endpoint)
router.post("/sign-in", async (c) => {
  // Check if running in local development (HTTP)
  const isLocalDev = c.req.url.startsWith("http://localhost") ||
    c.req.url.startsWith("http://127.0.0.1");

  // Get the base URL from the request for local development
  const requestUrl = new URL(c.req.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  const auth = createAuth(c.env, isLocalDev, isLocalDev ? baseUrl : undefined);

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
  let setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    // For local development: strip Secure flag from cookies to allow HTTP
    if (isLocalDev) {
      setCookie = setCookie.replace(/;\s*Secure/gi, "");
    }
    c.header("Set-Cookie", setCookie);
  }

  // Handle response - read response body first
  const text = await response.text();

  const data = text ? JSON.parse(text) : { success: true, status: response.status };
  return c.json(data, response.status as any);
});

// Sign up (maps to Better Auth's /sign-up/email endpoint)
router.post("/sign-up", async (c) => {
  // Check if running in local development (HTTP)
  const isLocalDev = c.req.url.startsWith("http://localhost") ||
    c.req.url.startsWith("http://127.0.0.1");

  // Get the base URL from the request for local development
  const requestUrl = new URL(c.req.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  const auth = createAuth(c.env, isLocalDev, isLocalDev ? baseUrl : undefined);

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

  let setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    // For local development: strip Secure flag from cookies to allow HTTP
    if (isLocalDev) {
      setCookie = setCookie.replace(/;\s*Secure/gi, "");
    }
    c.header("Set-Cookie", setCookie);
  }

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : { success: true };
  } catch (e) {
    data = { success: false, error: "Invalid response" };
  }

  // Use 200 status code if Better Auth returns success
  const statusCode = response.status >= 200 && response.status < 300 ? response.status : 200;
  return c.json(data, statusCode as any);
});

// Sign out
router.post("/sign-out", async (c) => {
  // Check if running in local development (HTTP)
  const isLocalDev = c.req.url.startsWith("http://localhost") ||
    c.req.url.startsWith("http://127.0.0.1");

  // Get the base URL from the request for local development
  const requestUrl = new URL(c.req.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  const auth = createAuth(c.env, isLocalDev, isLocalDev ? baseUrl : undefined);

  const url = new URL(c.req.url);
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.header(),
  });
  const response = await auth.handler(request);

  let setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    // For local development: strip Secure flag from cookies to allow HTTP
    if (isLocalDev) {
      setCookie = setCookie.replace(/;\s*Secure/gi, "");
    }
    c.header("Set-Cookie", setCookie);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : { success: true };
  return c.json(data, response.status as any);
});

// Get session
router.get("/session", async (c) => {
  // Check if running in local development (HTTP)
  const isLocalDev = c.req.url.startsWith("http://localhost") ||
    c.req.url.startsWith("http://127.0.0.1");

  // Get the base URL from the request
  const requestUrl = new URL(c.req.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  const auth = createAuth(c.env, isLocalDev, isLocalDev ? baseUrl : undefined);

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
  return c.json(data, response.status as any);
});

// Forgot password (maps to Better Auth's /request-password-reset endpoint)
router.post("/forgot-password", async (c) => {
  // Check if running in local development (HTTP)
  const isLocalDev = c.req.url.startsWith("http://localhost") ||
    c.req.url.startsWith("http://127.0.0.1");

  const auth = createAuth(c.env, isLocalDev);
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
  return c.json(data, response.status as any);
});

// Reset password
router.post("/reset-password", async (c) => {
  // Check if running in local development (HTTP)
  const isLocalDev = c.req.url.startsWith("http://localhost") ||
    c.req.url.startsWith("http://127.0.0.1");

  const auth = createAuth(c.env, isLocalDev);
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
  return c.json(data, response.status as any);
});

export { router as authRoutes };
