import { describe, expect, it } from 'vitest';
import { PricingError, priceBook } from './pricing';

describe('priceBook', () => {
  it('charges the base price for the included pages', () => {
    expect(priceBook({ format: 'square-8', pageCount: 20, coverType: 'softcover' })).toBe(2999);
  });

  it('adds a per-page charge above the included pages', () => {
    expect(priceBook({ format: 'landscape-11', pageCount: 30, coverType: 'softcover' })).toBe(
      4499 + 10 * 150,
    );
  });

  it('adds the cover upcharge', () => {
    expect(priceBook({ format: 'portrait-8x11', pageCount: 20, coverType: 'layflat' })).toBe(
      3999 + 3000,
    );
  });

  it.each([18, 102, 21, 20.5])('rejects an invalid page count of %s', (pageCount) => {
    expect(() => priceBook({ format: 'square-8', pageCount, coverType: 'hardcover' })).toThrow(
      PricingError,
    );
  });
});
