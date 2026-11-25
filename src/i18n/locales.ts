export const LOCALES = ['en', 'de', 'fr'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** BCP 47 tags for Intl, so numbers, dates, and money follow each language's regional conventions. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
};

/** Each language's own name, so people can find theirs whatever language is showing. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}
