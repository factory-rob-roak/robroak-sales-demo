import { describe, expect, it } from 'vitest';
import { de } from './de';
import { en } from './en';

describe('plural forms', () => {
  it('follow each language’s rules', () => {
    expect([0, 1, 2].map(en.projects.pageCount)).toEqual(['0 pages', '1 page', '2 pages']);
    expect([0, 1, 2].map(de.projects.pageCount)).toEqual(['0 Seiten', '1 Seite', '2 Seiten']);
  });

  it('agree the verb with the count', () => {
    expect(de.order.emptySpreads(1)).toBe('1 Doppelseite hat keine Fotos und wird leer gedruckt.');
    expect(de.order.emptySpreads(2)).toBe('2 Doppelseiten haben keine Fotos und werden leer gedruckt.');
  });
});

describe('number formatting', () => {
  it('formats percentages for each locale', () => {
    expect(en.zoom.value(125)).toBe('125%');
    expect(de.zoom.value(125)).toBe('125\u00a0%');
  });
});

describe('unpriceable books', () => {
  it('keep the English reason but use a general message elsewhere', () => {
    expect(en.order.unpriceable('Page count must be even')).toBe(
      "This book can't be printed yet: Page count must be even.",
    );
    expect(de.order.unpriceable('Page count must be even')).toBe('Dieses Buch kann noch nicht gedruckt werden.');
  });
});
