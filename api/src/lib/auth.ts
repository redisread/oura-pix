import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "@oura-pix/database";
import { DEFAULT_LOCALE, type Locale } from "@oura-pix/i18n";
import { sendPasswordResetEmail } from "./mail";

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
    },
  });
}

export function getSessionTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get("Authorization")?.replace("Bearer ", "");
  if (auth) return auth;

  const cookie = headers.get("Cookie");
  if (!cookie) return null;

  const match =
    cookie.match(/better-auth\.session_token=([^;]+)/) ||
    cookie.match(/ourapix\.session=([^;]+)/);
  return match?.[1] ?? null;
}

export function normalizeLocalSetCookie(setCookie: string | null, requestUrl: string): string | null {
  if (!setCookie) return null;
  return isLocalAuthUrl(requestUrl) ? setCookie.replace(/;\s*Secure/gi, "") : setCookie;
}
