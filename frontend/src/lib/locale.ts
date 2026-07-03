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

/** 短日期时间格式：07/03 14:32 — 用于表格行内时间展示 */
export const formatShortDateTime = (value: string | number | Date): string =>
  formatLocaleDateTime(value, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

/** 短日期格式：2026/07/03 — 用于表格、卡片、列表中的日期展示 */
export const formatShortDate = (value: string | number | Date): string =>
  formatLocaleDate(value, { year: "numeric", month: "2-digit", day: "2-digit" });
