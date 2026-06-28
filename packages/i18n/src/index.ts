import enServerMessages from "../messages/server/en.json";
import jaServerMessages from "../messages/server/ja.json";
import zhServerMessages from "../messages/server/zh-CN.json";

export const LOCALES = ["zh-CN", "en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const GENERATION_LANGUAGES = ["zh", "en", "ja"] as const;
export type GenerationLanguage = (typeof GENERATION_LANGUAGES)[number];

export const LOCALE_HEADER = "X-Oura-Locale";

export interface CategoryTranslation {
  key: string;
  name: string;
  description: string;
  bestPractices: string;
}

export interface TemplateTranslation {
  key: string;
  categoryKey: string;
  name: string;
  description: string;
}

interface ServerMessages {
  api: Record<string, string>;
  mail: Record<string, string>;
  notifications: Record<string, { title: string; message: string }>;
  categories: CategoryTranslation[];
  templates: TemplateTranslation[];
}

interface HeaderGetter {
  get(name: string): string | null;
}

type HeaderLike = HeaderGetter | Record<string, string | undefined | null>;

const SERVER_MESSAGES: Record<Locale, ServerMessages> = {
  "zh-CN": zhServerMessages,
  en: enServerMessages,
  ja: jaServerMessages,
};

const LANGUAGE_TO_LOCALE: Record<string, Locale> = {
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
  "zh-sg": "zh-CN",
  "zh-tw": "zh-CN",
  "zh-hant": "zh-CN",
  en: "en",
  ja: "ja",
  jp: "ja",
};

const LOCALE_TO_GENERATION_LANGUAGE: Record<Locale, GenerationLanguage> = {
  "zh-CN": "zh",
  en: "en",
  ja: "ja",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function isGenerationLanguage(
  value: string | null | undefined
): value is GenerationLanguage {
  return GENERATION_LANGUAGES.includes(value as GenerationLanguage);
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  if (isLocale(value)) return value;

  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (!normalized) return null;
  if (LANGUAGE_TO_LOCALE[normalized]) return LANGUAGE_TO_LOCALE[normalized];

  const primary = normalized.split("-")[0];
  return primary ? LANGUAGE_TO_LOCALE[primary] ?? null : null;
}

export function localeToGenerationLanguage(locale: Locale): GenerationLanguage {
  return LOCALE_TO_GENERATION_LANGUAGE[locale];
}

export function generationLanguageToLocale(language: string | null | undefined): Locale {
  if (language === "zh") return "zh-CN";
  if (language === "ja") return "ja";
  if (language === "en") return "en";
  return DEFAULT_LOCALE;
}

function getHeader(headers: HeaderLike | null | undefined, name: string): string | null {
  if (!headers) return null;
  if ("get" in headers && typeof headers.get === "function") {
    return headers.get(name);
  }

  const record = headers as Record<string, string | undefined | null>;
  const direct = record[name] ?? record[name.toLowerCase()];
  if (direct) return direct;

  const found = Object.entries(record).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  const value = found?.[1];
  return typeof value === "string" ? value : null;
}

function parseAcceptLanguage(value: string | null | undefined): Locale | null {
  if (!value) return null;

  return value
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { locale: normalizeLocale(tag), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item): item is { locale: Locale; q: number } => item.locale !== null)
    .sort((a, b) => b.q - a.q)[0]?.locale ?? null;
}

export function resolveLocale(input?: {
  headers?: HeaderLike | null;
  explicitLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  const explicit = normalizeLocale(input?.explicitLocale);
  if (explicit) return explicit;

  const headerLocale = normalizeLocale(getHeader(input?.headers, LOCALE_HEADER));
  if (headerLocale) return headerLocale;

  const acceptLanguage =
    input?.acceptLanguage ?? getHeader(input?.headers, "Accept-Language");
  return parseAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}

function formatTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function serverMessage(
  locale: Locale,
  key: keyof ServerMessages["api"],
  values: Record<string, string | number> = {}
): string {
  const template = SERVER_MESSAGES[locale].api[key] ?? SERVER_MESSAGES[DEFAULT_LOCALE].api[key];
  return template ? formatTemplate(template, values) : String(key);
}

export function mailMessage(
  locale: Locale,
  key: keyof ServerMessages["mail"],
  values: Record<string, string | number> = {}
): string {
  const template = SERVER_MESSAGES[locale].mail[key] ?? SERVER_MESSAGES[DEFAULT_LOCALE].mail[key];
  return template ? formatTemplate(template, values) : String(key);
}

export function notificationMessage(
  locale: Locale,
  key: keyof ServerMessages["notifications"],
  values: Record<string, string | number> = {}
): { title: string; message: string } {
  const template =
    SERVER_MESSAGES[locale].notifications[key] ??
    SERVER_MESSAGES[DEFAULT_LOCALE].notifications[key];
  if (!template) {
    return { title: String(key), message: String(key) };
  }
  return {
    title: formatTemplate(template.title, values),
    message: formatTemplate(template.message, values),
  };
}

export function getPresetCategories(locale: Locale): CategoryTranslation[] {
  return SERVER_MESSAGES[locale].categories;
}

export function getPresetTemplates(locale: Locale): TemplateTranslation[] {
  return SERVER_MESSAGES[locale].templates;
}
