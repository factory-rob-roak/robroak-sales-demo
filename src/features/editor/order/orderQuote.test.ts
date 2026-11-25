import { describe, expect, it, vi } from 'vitest';
import { en } from '../../../i18n/messages/en';
import * as pricing from '../../../lib/pricing';
import { describeOrderIssue, quoteBook } from './orderQuote';

vi.mock('../../../lib/pricing', async (importOriginal) => {
  const actual = await importOriginal<typeof pricing>();
  return { ...actual, priceBook: vi.fn(actual.priceBook) };
});

const quote = (pageCount: number) =>
  quoteBook({ format: 'portrait-8x11', coverType: 'layflat', pageCount });

describe('quoteBook', () => {
  it('derives every breakdown amount from priceBook', () => {
    expect(quote(24)).toEqual({
      status: 'priced',
      totalCents: 7499,
      breakdown: { baseCents: 3999, extraPages: 4, extraPagesCents: 500, coverCents: 3000 },
    });
  });

  it('reports missing pages with the minimum price', () => {
    expect(quote(4)).toEqual({ status: 'too-few-pages', pagesNeeded: 16, minimumCents: 6999 });
  });

  it('reports pages over the maximum', () => {
    expect(quote(104)).toEqual({ status: 'too-many-pages', pagesOver: 4 });
  });

  it.each([
    [21, 'Page count must be even'],
    [19.5, 'Page count must be between 20 and 100'],
  ])('reports %s pages as unpriceable', (pageCount, reason) => {
    expect(quote(pageCount)).toEqual({ status: 'unpriceable', reason });
  });

  it('rethrows errors that are not pricing errors', () => {
    vi.mocked(pricing.priceBook).mockImplementationOnce(() => {
      throw new TypeError('boom');
    });
    expect(() => quote(20)).toThrow(TypeError);
  });
});

describe('describeOrderIssue', () => {
  it.each([
    [20, null],
    [4, 'Add 16 more pages to reach the 20-page minimum.'],
    [19, 'Add 1 more page to reach the 20-page minimum.'],
    [104, 'Books can have at most 100 pages. Remove 4 pages.'],
    [101, 'Books can have at most 100 pages. Remove 1 page.'],
    [21, "This book can't be printed yet: Page count must be even."],
  ])('explains a %s-page book', (pageCount, message) => {
    expect(describeOrderIssue(quote(pageCount), en.order)).toBe(message);
  });
});
