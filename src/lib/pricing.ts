import type { BookFormat, BookSpec, CoverType } from '../types';

export const MIN_PAGES = 20;
export const MAX_PAGES = 100;
export const INCLUDED_PAGES = 20;

const BASE_PRICE_CENTS: Record<BookFormat, number> = {
  'square-8': 2999,
  'landscape-11': 4499,
  'portrait-8x11': 3999,
};

const EXTRA_PAGE_CENTS: Record<BookFormat, number> = {
  'square-8': 100,
  'landscape-11': 150,
  'portrait-8x11': 125,
};

const COVER_UPCHARGE_CENTS: Record<CoverType, number> = {
  softcover: 0,
  hardcover: 1500,
  layflat: 3000,
};

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

/** Returns the price of a book in integer cents. */
export function priceBook({ format, pageCount, coverType }: BookSpec): number {
  if (!Number.isInteger(pageCount) || pageCount < MIN_PAGES || pageCount > MAX_PAGES) {
    throw new PricingError(`Page count must be between ${MIN_PAGES} and ${MAX_PAGES}`);
  }
  // Pages are printed on both sides of a sheet.
  if (pageCount % 2 !== 0) {
    throw new PricingError('Page count must be even');
  }
  const extraPages = pageCount - INCLUDED_PAGES;
  return (
    BASE_PRICE_CENTS[format] + extraPages * EXTRA_PAGE_CENTS[format] + COVER_UPCHARGE_CENTS[coverType]
  );
}
