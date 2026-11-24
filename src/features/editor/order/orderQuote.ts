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

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

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
export function describeOrderIssue(quote: OrderQuote): string | null {
  switch (quote.status) {
    case 'priced':
      return null;
    case 'too-few-pages':
      return `Add ${pluralize(quote.pagesNeeded, 'more page', 'more pages')} to reach the ${MIN_PAGES}-page minimum.`;
    case 'too-many-pages':
      return `Books can have at most ${MAX_PAGES} pages. Remove ${pluralize(quote.pagesOver, 'page')}.`;
    case 'unpriceable':
      return `This book can't be printed yet: ${quote.reason}.`;
  }
}
