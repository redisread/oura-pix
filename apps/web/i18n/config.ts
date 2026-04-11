/**
 * next-intl Configuration
 * Internationalization setup for OuraPix
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

/**
 * Supported locales
 */
export const locales = ['en', 'zh'] as const;

/**
 * Default locale
 */
export const defaultLocale = 'en';

/**
 * Locale type
 */
export type Locale = typeof locales[number];

/**
 * Locale metadata for UI display
 */
export const localeMetadata: Record<Locale, { name: string; flag: string; direction: 'ltr' | 'rtl' }> = {
  en: {
    name: 'English',
    flag: 'US',
    direction: 'ltr',
  },
  zh: {
    name: '中文',
    flag: 'CN',
    direction: 'ltr',
  },
};

/**
 * Validate locale
 * @param locale - Locale string
 * @returns True if locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get locale from request headers
 * @param requestHeaders - Request headers
 * @returns Detected locale or default
 */
export function getLocaleFromHeaders(requestHeaders: Headers): Locale {
  const acceptLanguage = requestHeaders.get('accept-language');

  if (!acceptLanguage) {
    return defaultLocale;
  }

  // Parse accept-language header
  const preferredLocales = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, quality = '1'] = lang.split(';q=');
      return {
        code: code.trim().split('-')[0].toLowerCase(),
        quality: parseFloat(quality),
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first matching locale
  for (const pref of preferredLocales) {
    const matched = locales.find(
      (loc) => loc.toLowerCase() === pref.code
    );
    if (matched) {
      return matched;
    }
  }

  return defaultLocale;
}

/**
 * Request configuration for next-intl
 */
export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load messages for the locale
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    messages,
    timeZone: locale === 'zh' ? 'Asia/Shanghai' : 'UTC',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: locale === 'zh' ? 'CNY' : 'USD',
        },
      },
    },
  };
});
