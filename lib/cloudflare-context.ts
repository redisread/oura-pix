/**
 * Cloudflare Context Module (Refactored)
 *
 * 统一使用 OpenNext 的 getCloudflareContext,无论开发还是生产环境
 * 开发环境依赖 initOpenNextCloudflareForDev 预初始化
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
  BETTER_AUTH_SECRET: string;
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
 * Execution context interface
 */
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Cloudflare context interface
 */
export interface CloudflareContext {
  env: CloudflareEnv;
  ctx: ExecutionContext;
  caches: CacheStorage;
}

/**
 * Get Cloudflare Context (统一实现)
 *
 * 开发和生产环境都使用 OpenNext 的 getCloudflareContext
 * 开发环境需要先调用 initOpenNextCloudflareForDev
 *
 * @returns Cloudflare context with env, ctx, and caches
 */
export async function getCloudflareContext(): Promise<CloudflareContext> {
  try {
    const { getCloudflareContext: getCfContext } = await import(
      "@opennextjs/cloudflare"
    );

    const ctx = getCfContext();

    // 开发环境兜底检查
    if (process.env.NODE_ENV === 'development' && !ctx.env.DB) {
      throw new Error(
        "Cloudflare context not initialized. " +
        "Make sure initOpenNextCloudflareForDev() is called before accessing bindings."
      );
    }

    const env = ctx.env as unknown as CloudflareEnv;

    return {
      env,
      ctx: {
        waitUntil: (p) => ctx.ctx.waitUntil(p),
        passThroughOnException: () => ctx.ctx.passThroughOnException(),
      },
      caches: (globalThis as any).caches || ({} as CacheStorage),
    };
  } catch (error) {
    console.error("[cloudflare-context] Failed to get context:", error);
    throw new Error(
      "Failed to get Cloudflare context. " +
      "In development, ensure initOpenNextCloudflareForDev() was called. " +
      "In production, ensure OpenNext build was successful."
    );
  }
}

/**
 * Get D1 database instance
 */
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return env.DB;
}

/**
 * Get R2 bucket instance
 */
export async function getR2(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext();
  return env.R2;
}

/**
 * Get specific environment variable from Cloudflare bindings
 */
export async function getEnvVar(key: string): Promise<string | undefined> {
  const { env } = await getCloudflareContext();
  return (env as unknown as Record<string, unknown>)[key] as string | undefined;
}

/**
 * Check if running in Cloudflare Workers environment
 */
export function isCloudflareEnvironment(): boolean {
  return typeof globalThis !== "undefined" && "caches" in globalThis && typeof (globalThis as any).caches !== "undefined";
}
