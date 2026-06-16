/**
 * OuraPix API - Cloudflare Workers + Hono
 *
 * Main entry point for the API server
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import { secureHeaders } from "hono/secure-headers";

import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { generationRoutes } from "./routes/generations";
import { uploadRoutes } from "./routes/upload";
import { subscriptionRoutes } from "./routes/subscription";
import { favoriteRoutes } from "./routes/favorites";
import statsRoutes from "./routes/stats";
import notificationRoutes from "./routes/notifications";
import errorRoutes from "./routes/errors";
import { stripeWebhookRoutes } from "./routes/webhooks/stripe";
import { authMiddleware } from "./middleware/auth";

// Create Hono app with Cloudflare bindings
const app = new Hono<{
  Bindings: {
    DB: D1Database;
    R2: R2Bucket;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    GEMINI_API_KEY: string;
    GEMINI_BASE_URL?: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    RESEND_API_KEY: string;
    FROM_EMAIL: string;
    FROM_NAME: string;
    CLOUDFLARE_R2_PUBLIC_URL: string;
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
    AUTH_GITHUB_ID?: string;
    AUTH_GITHUB_SECRET?: string;
  };
}>();

// ============================================
// Global Middleware
// ============================================

app.use("*", logger());
app.use("*", timing());
app.use("*", secureHeaders());

// CORS configuration
app.use("/api/*", cors({
  origin: ["https://ourapix.jiahongw.com", "http://localhost:4001", "http://localhost:4545"],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// ============================================
// Health Check
// ============================================

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug test route
app.get("/api/test", (c) => {
  return c.json({ message: "Test route works", path: c.req.path });
});
app.post("/api/test", (c) => {
  return c.json({ message: "Test POST route works", path: c.req.path });
});

// ============================================
// API Routes
// ============================================

// Public routes (must be before protected routes)
app.route("/api/auth", authRoutes);

// Protected routes (require authentication)
// Apply auth middleware only to non-auth routes
app.use("/api/*", async (c, next) => {
  // Skip auth middleware for auth routes
  if (c.req.path.startsWith("/api/auth")) {
    return await next();
  }
  // Cast context to match middleware's expected type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await authMiddleware(c as any, next);
});

// Protected API routes
app.route("/api/user", userRoutes);
app.route("/api/generations", generationRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/subscription", subscriptionRoutes);
app.route("/api/favorites", favoriteRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/errors", errorRoutes);
app.route("/api/webhooks", stripeWebhookRoutes);

// ============================================
// Error Handling
// ============================================

app.onError((err, c) => {
  console.error("[API] Error:", err);

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Internal server error",
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    404
  );
});

export default app;
