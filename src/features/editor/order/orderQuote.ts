import type { Messages } from '../../../i18n/catalogs';
import { INCLUDED_PAGES, MAX_PAGES, MIN_PAGES, PricingError, priceBook } from '../../../lib/pricing';
import type { BookSpec } from '../../../types';

export interface PriceBreakdown {
  baseCents: number;
  extraPages: number;
  extraPagesCents: number;
  coverCents: number;
}

export type OrderQuote =
  | { status: 'priced'; totalCents: number; breakdown: PriceBreakdown }
  | { status: 'too-few-pages'; pagesNeeded: number; minimumCents: number }
  | { status: 'too-many-pages'; pagesOver: number }
  | { status: 'unpriceable'; reason: string };

// Every amount is a priceBook result or a difference of two, so no price lives here.
export function quoteBook(spec: BookSpec): OrderQuote {
  const { format, coverType, pageCount } = spec;
  if (Number.isInteger(pageCount) && pageCount < MIN_PAGES) {
    return {
      status: 'too-few-pages',
      pagesNeeded: MIN_PAGES - pageCount,
      minimumCents: priceBook({ format, coverType, pageCount: MIN_PAGES }),
    };
  }
  if (Number.isInteger(pageCount) && pageCount > MAX_PAGES) {
    return { status: 'too-many-pages', pagesOver: pageCount - MAX_PAGES };
  }
  try {
    const totalCents = priceBook(spec);
    const baseCents = priceBook({ format, coverType: 'softcover', pageCount: INCLUDED_PAGES });
    const softcoverCents = priceBook({ format, coverType: 'softcover', pageCount });
    return {
      status: 'priced',
      totalCents,
      breakdown: {
        baseCents,
        extraPages: pageCount - INCLUDED_PAGES,
        extraPagesCents: softcoverCents - baseCents,
        coverCents: totalCents - softcoverCents,
      },
    };
  } catch (error) {
    if (error instanceof PricingError) {
      return { status: 'unpriceable', reason: error.message };
    }
    throw error;
  }
}

/** Explains why a book cannot be ordered, or returns null when it can. */
export function describeOrderIssue(quote: OrderQuote, t: Messages['order']): string | null {
  switch (quote.status) {
    case 'priced':
      return null;
    case 'too-few-pages':
      return t.tooFewPages(quote.pagesNeeded, MIN_PAGES);
    case 'too-many-pages':
      return t.tooManyPages(MAX_PAGES, quote.pagesOver);
    case 'unpriceable':
      return t.unpriceable(quote.reason);
  }
}
