/**
 * Formats integer cents as US dollars. `locale` is a BCP 47 tag that only
 * changes separators and symbol placement, never the currency.
 */
export function formatCents(cents: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
}
