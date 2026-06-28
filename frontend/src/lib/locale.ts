import type { Locale } from "@oura-pix/i18n";
import { getLocale } from "@/paraglide/runtime.js";

export function getCurrentLocale(): Locale {
  try {
    return getLocale() as Locale;
  } catch {
    return "zh-CN";
  }
}

export function formatLocaleDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleDateString(getCurrentLocale(), options);
}

export function formatLocaleDateTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleString(getCurrentLocale(), options);
}
