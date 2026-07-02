import type { Context } from "hono";
import {
  isLocale,
  resolveLocale,
  serverMessage,
  type Locale,
} from "@oura-pix/i18n";

export type { Locale } from "@oura-pix/i18n";

export function contextLocale(c: Context): Locale {
  const get = c.get as (key: string) => unknown;
  const locale = get("locale");
  if (typeof locale === "string" && isLocale(locale)) return locale;
  return resolveLocale({ headers: c.req.raw.headers });
}

/**
 * Resolve locale from Hono context for server-side message lookups.
 * Replaces the per-route `function getLocale(c)` that was duplicated
 * across categories.ts, generations.ts, and v1/generate.ts.
 */
export function getLocale(c: { req: { raw: Request } }): Locale {
  return resolveLocale({ headers: c.req.raw.headers });
}

export function apiMessage(
  c: Context,
  key: string,
  values: Record<string, string | number> = {}
): string {
  return serverMessage(contextLocale(c), key, values);
}
