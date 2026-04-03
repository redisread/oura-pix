/**
 * Cloudflare Environment Types
 */

export interface CloudflareEnv {
  // Cloudflare bindings
  DB: D1Database;
  R2: R2Bucket;

  // App config
  BETTER_AUTH_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  CLOUDFLARE_R2_PUBLIC_URL: string;
  FROM_EMAIL: string;
  FROM_NAME: string;

  // Secrets
  BETTER_AUTH_SECRET: string;
  GEMINI_API_KEY: string;
  GEMINI_BASE_URL?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
}

/**
 * Hono Context with Cloudflare bindings
 */
export type AppContext = import("hono").Context<{
  Bindings: CloudflareEnv;
}>;

/**
 * Get Cloudflare context from Hono context
 */
export function getCloudflareContext(c: AppContext): CloudflareEnv {
  return c.env;
}
