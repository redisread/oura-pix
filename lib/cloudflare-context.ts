/**
 * Cloudflare Context Module
 *
 * Provides unified access to Cloudflare bindings (D1, R2) that works in both:
 * - Production: Uses OpenNext's getCloudflareContext
 * - Local development: Uses wrangler's getPlatformProxy for local emulation
 *
 * This enables `next dev` to work with D1 and R2 bindings without wrangler dev.
 */

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

/**
 * Cloudflare environment bindings interface
 */
export interface CloudflareEnv {
  // Cloudflare bindings
  DB: D1Database;
  R2: R2Bucket;
  // App config (wrangler.toml [vars])
  NEXT_PUBLIC_APP_URL: string;
  BETTER_AUTH_URL: string;
  CLOUDFLARE_R2_PUBLIC_URL: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_STARTER_PRICE_ID: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
  STRIPE_CREDITS_SMALL_PRICE_ID: string;
  STRIPE_CREDITS_MEDIUM_PRICE_ID: string;
  STRIPE_CREDITS_LARGE_PRICE_ID: string;
  // Secrets (.dev.vars local / Cloudflare Secrets production)
  AUTH_SECRET: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  GEMINI_API_KEY: string;
  GEMINI_BASE_URL?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AUTH_GITHUB_ID?: string;
  AUTH_GITHUB_SECRET?: string;
}

/**
 * Simplified execution context for local development
 */
interface LocalExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Cloudflare context interface
 */
export interface CloudflareContext {
  env: CloudflareEnv;
  ctx: LocalExecutionContext;
  caches: CacheStorage;
}

/**
 * Local development bindings cache
 */
let localBindings: CloudflareEnv | null = null;

/**
 * Initialize local development bindings using wrangler's getPlatformProxy
 * This provides local D1 and R2 emulation for `next dev`
 *
 * NOTE: This function should only be called in development mode.
 * In production, OpenNext's getCloudflareContext is used instead.
 */
async function initLocalBindings(): Promise<CloudflareEnv> {
  if (localBindings) return localBindings;

  // Skip wrangler import in production to avoid bundling it
  // This is critical for reducing the Worker bundle size
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "Cloudflare bindings not available in production. " +
      "Make sure you're using OpenNext's getCloudflareContext."
    );
  }

  try {
    // Dynamic import with webpackIgnore to prevent bundling in production
    const { getPlatformProxy } = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      "wrangler"
    );
    const platform = await getPlatformProxy({
      configPath: "./wrangler.toml",
    });

    localBindings = platform.env as unknown as CloudflareEnv;

    console.log("[cloudflare-context] Local bindings initialized from wrangler.toml");
    return localBindings;
  } catch (error) {
    console.error("[cloudflare-context] Failed to initialize local bindings:", error);
    throw new Error(
      "Failed to initialize Cloudflare bindings. Make sure wrangler.toml exists and has valid D1/R2 bindings."
    );
  }
}

/**
 * Get Cloudflare Context
 *
 * - Production: Uses OpenNext's getCloudflareContext
 * - Local development: Uses wrangler getPlatformProxy for local emulation
 *
 * @returns Cloudflare context with env, ctx, and caches
 */
export async function getCloudflareContext(): Promise<CloudflareContext> {
  // Try OpenNext's getCloudflareContext first (production environment)
  try {
    const { getCloudflareContext: getCfContext } = await import("@opennextjs/cloudflare");
    const ctx = getCfContext();
    // Cast to our interface type
    const env = ctx.env as unknown as CloudflareEnv;
    return {
      env,
      ctx: {
        waitUntil: (p) => ctx.ctx.waitUntil(p),
        passThroughOnException: () => ctx.ctx.passThroughOnException(),
      },
      caches: (globalThis as any).caches || ({} as CacheStorage),
    };
  } catch {
    // OpenNext context not available, fall back to local development mode
  }

  // Local development mode: use wrangler to simulate bindings
  const bindings = await initLocalBindings();

  return {
    env: bindings,
    ctx: {
      waitUntil: (_promise: Promise<unknown>) => {},
      passThroughOnException: () => {},
    },
    caches: typeof globalThis !== "undefined" && "caches" in globalThis
      ? (globalThis as any).caches
      : ({} as CacheStorage),
  };
}

/**
 * Get D1 database instance
 *
 * @returns D1 database binding
 */
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return env.DB;
}

/**
 * Get R2 bucket instance
 *
 * @returns R2 bucket binding
 */
export async function getR2(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext();
  return env.R2;
}

/**
 * Get specific environment variable from Cloudflare bindings
 *
 * @param key - Environment variable key
 * @returns Environment variable value or undefined
 */
export async function getEnvVar(key: string): Promise<string | undefined> {
  const { env } = await getCloudflareContext();
  return (env as unknown as Record<string, unknown>)[key] as string | undefined;
}

/**
 * Check if running in Cloudflare Workers environment
 *
 * @returns True if in production Cloudflare environment
 */
export function isCloudflareEnvironment(): boolean {
  // Check if we're in a Cloudflare Worker by checking for global scope
  return typeof globalThis !== "undefined" && "caches" in globalThis && typeof (globalThis as any).caches !== "undefined";
}