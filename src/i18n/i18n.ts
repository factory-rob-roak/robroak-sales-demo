import { formatCents } from '../lib/money';
import type { Messages } from './catalogs';
import { createFormatters } from './format';
import { INTL_LOCALE, type Locale } from './locales';

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
  formatNumber: (value: number) => string;
  /** Accepts a Date or an ISO 8601 string. */
  formatDate: (value: Date | string) => string;
  /** Money still comes from priceBook in integer cents; only the display follows the locale. */
  formatCents: (cents: number) => string;
}

export function createI18n(locale: Locale, messages: Messages, setLocale: (locale: Locale) => void): I18n {
  const tag = INTL_LOCALE[locale];
  const dateFormat = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
  return {
    locale,
    setLocale,
    t: messages,
    formatNumber: createFormatters(locale).number,
    formatDate: (value) => dateFormat.format(typeof value === 'string' ? new Date(value) : value),
    formatCents: (cents) => formatCents(cents, tag),
  };
}
