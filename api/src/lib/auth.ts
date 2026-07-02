import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "@oura-pix/database";
import { DEFAULT_LOCALE, type Locale } from "@oura-pix/i18n";
import { sendPasswordResetEmail } from "./mail";
import type { Context } from "hono";
import { apiMessage } from "./i18n";


export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NEXT_PUBLIC_APP_URL?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  RESEND_API_KEY?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AUTH_GITHUB_ID?: string;
  AUTH_GITHUB_SECRET?: string;
}

export function isLocalAuthUrl(url: string): boolean {
  return url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");
}

export function requestBaseUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}`;
}

export function createAuth(
  env: AuthEnv,
  requestUrl?: string,
  locale: Locale = DEFAULT_LOCALE
) {
  const db = createDb(env.DB);
  const requestIsLocal = requestUrl ? isLocalAuthUrl(requestUrl) : false;
  const envIsLocal = isLocalAuthUrl(env.BETTER_AUTH_URL);
  const isLocalDev = requestIsLocal || envIsLocal;
  const baseURL = requestIsLocal ? requestBaseUrl(requestUrl!) : env.BETTER_AUTH_URL;

  return betterAuth({
    baseURL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      env.BETTER_AUTH_URL,
      env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL,
      "http://localhost:4321",
      "http://localhost:8787",
      "http://localhost:8989",
    ],
    socialProviders: {
      google: {
        enabled: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
        clientId: env.AUTH_GOOGLE_ID || "",
        clientSecret: env.AUTH_GOOGLE_SECRET || "",
      },
      github: {
        enabled: !!(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET),
        clientId: env.AUTH_GITHUB_ID || "",
        clientSecret: env.AUTH_GITHUB_SECRET || "",
      },
    },
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
        if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.FROM_NAME) return;
        await sendPasswordResetEmail(
          { email: user.email, name: user.name || undefined },
          { resetUrl: url, userName: user.name || user.email },
          {
            RESEND_API_KEY: env.RESEND_API_KEY,
            FROM_EMAIL: env.FROM_EMAIL,
            FROM_NAME: env.FROM_NAME,
          },
          locale
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
    advanced: {
      disableCSRFCheck: isLocalDev,
      useSecureCookies: !isLocalDev,
      // P0 #88: 跨子域 Cookie 共享（仅生产环境）
      // 前端 ourapix.jiahongw.com / API api.ourapix.jiahongw.com
      // 共享主域 .jiahongw.com
      ...(isLocalDev
        ? {}
        : {
            crossSubDomainCookies: {
              enabled: true,
              domain: ".jiahongw.com",
            },
            defaultCookieAttributes: {
              sameSite: "none",
              secure: true,
            },
          }),
    },
  });
}

export function getSessionTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get("Authorization")?.replace("Bearer ", "");
  if (auth) return auth;

  const cookie = headers.get("Cookie");
  if (!cookie) return null;

  const match =
    // Matches: better-auth.session_token, __Secure-better-auth.session_token, __Host-better-auth.session-token
    cookie.match(/(?:__Secure-|__Host-)?better-auth[.-]session[_-]token=([^;]+)/) ||
    cookie.match(/ourapix\.session=([^;]+)/);
  return match?.[1] ?? null;
}

export function normalizeLocalSetCookie(setCookie: string | null, requestUrl: string): string | null {
  if (!setCookie) return null;
  return isLocalAuthUrl(requestUrl) ? setCookie.replace(/;\s*Secure/gi, "") : setCookie;
}


export interface ForwardAuthOptions {
  method?: string;
  pathnameRewrite?: string | ((current: string) => string);
  forwardBody?: boolean;
  locale?: Locale;
}

/**
 * Forward a request to Better Auth, handling Set-Cookie normalization
 * and JSON response parsing. Eliminates ~80 lines of duplicated
 * handler boilerplate across the 6 auth route handlers.
 */
export async function forwardAuthRequest(
  c: Context,
  options: ForwardAuthOptions = {}
): Promise<{ status: number; data: unknown }> {
  const { method, pathnameRewrite, forwardBody, locale } = options;

  const auth = createAuth(c.env as AuthEnv, c.req.url, locale);

  const url = new URL(c.req.url);
  if (pathnameRewrite) {
    url.pathname =
      typeof pathnameRewrite === "function"
        ? pathnameRewrite(url.pathname)
        : pathnameRewrite;
  }

  const rawHeaders = c.req.header();
  const headers = rawHeaders instanceof Headers ? rawHeaders : new Headers(rawHeaders);

  let body: string | undefined;
  if (forwardBody) {
    body = await c.req.text();
  }

  const request = new Request(url.toString(), {
    method: method ?? c.req.raw.method,
    headers,
    body: body || undefined,
  });

  const response = await auth.handler(request);

  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie) {
    const normalized = normalizeLocalSetCookie(setCookie, c.req.url);
    if (normalized) c.header("Set-Cookie", normalized);
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : { success: true };
  } catch {
    data = { success: false, error: apiMessage(c, "internalError") };
  }

  return { status: response.status, data };
}
