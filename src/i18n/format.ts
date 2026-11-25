import { INTL_LOCALE, type Locale } from './locales';

export type PluralForms = { one: string; other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

export interface Formatters {
  number: (value: number) => string;
  percent: (percent: number) => string;
  /** Picks the form for `count` by the language's plural rules, falling back to `other`. */
  plural: (count: number, forms: PluralForms) => string;
}

export function createFormatters(locale: Locale): Formatters {
  const tag = INTL_LOCALE[locale];
  const numberFormat = new Intl.NumberFormat(tag);
  const percentFormat = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 });
  const pluralRules = new Intl.PluralRules(tag);
  return {
    number: (value) => numberFormat.format(value),
    percent: (percent) => percentFormat.format(percent / 100),
    plural: (count, forms) => forms[pluralRules.select(count)] ?? forms.other,
  };
}
