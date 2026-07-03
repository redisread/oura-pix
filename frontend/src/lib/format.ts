/**
 * Shared Formatting Utilities
 *
 * 收敛组件层重复的时间格式化、平台标签等展示逻辑。
 */

import * as m from "@/paraglide/messages.js";
import { formatLocaleDate } from "@/lib/locale";

export type Platform =
  | "amazon"
  | "shopify"
  | "etsy"
  | "ebay"
  | "taobao"
  | "jd"
  | "tmall"
  | "self"
  | "other";

const PLATFORM_I18N: Record<Platform, () => string> = {
  amazon: m.competitors_platformAmazon,
  shopify: m.competitors_platformShopify,
  etsy: m.competitors_platformEtsy,
  ebay: m.competitors_platformEbay,
  taobao: m.competitors_platformTaobao,
  jd: m.competitors_platformJd,
  tmall: m.competitors_platformTmall,
  self: m.competitors_platformSelf,
  other: m.competitors_platformOther,
};

/** 平台标签 — i18n 感知 */
export function getPlatformLabel(platform: string | undefined): string {
  if (platform && platform in PLATFORM_I18N) {
    return PLATFORM_I18N[platform as Platform]();
  }
  return m.common_custom();
}

/**
 * 相对时间格式化 — 用于卡片/列表中的时间展示。
 * < 1 分钟 → "刚刚"
 * < 1 小时 → "N 分钟前"
 * < 1 天 → "N 小时前"
 * < 7 天 → "N 天前"
 * >= 7 天 → 短日期格式 "2026/07/03"
 */
export function formatRelativeTime(value: string | number | Date): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return m.common_justNow();
  if (diffMins < 60) return m.common_minutesAgo({ count: diffMins.toString() });
  if (diffHours < 24) return m.common_hoursAgo({ count: diffHours.toString() });
  if (diffDays < 7) return m.common_daysAgo({ count: diffDays.toString() });
  return formatLocaleDate(date);
}
