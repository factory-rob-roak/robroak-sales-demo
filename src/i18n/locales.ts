export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** BCP 47 tags for Intl, so numbers, dates, and money follow each language's regional conventions. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}
