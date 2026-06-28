import type { Context } from "hono";
import {
  isLocale,
  resolveLocale,
  serverMessage,
  type Locale,
} from "@oura-pix/i18n";

export function contextLocale(c: Context): Locale {
  const get = c.get as (key: string) => unknown;
  const locale = get("locale");
  if (typeof locale === "string" && isLocale(locale)) return locale;
  return resolveLocale({ headers: c.req.raw.headers });
}

export function apiMessage(
  c: Context,
  key: string,
  values: Record<string, string | number> = {}
): string {
  return serverMessage(contextLocale(c), key, values);
}
