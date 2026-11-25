import { describe, expect, it } from 'vitest';
import { de } from './de';
import { en } from './en';
import { fr } from './fr';

describe('plural forms', () => {
  it('follow each language’s rules', () => {
    expect([0, 1, 2].map(en.projects.pageCount)).toEqual(['0 pages', '1 page', '2 pages']);
    expect([0, 1, 2].map(de.projects.pageCount)).toEqual(['0 Seiten', '1 Seite', '2 Seiten']);
    // French treats 0 as singular.
    expect([0, 1, 2].map(fr.projects.pageCount)).toEqual(['0 page', '1 page', '2 pages']);
  });

  it('fall back to the other form for plural categories a message does not list', () => {
    // French uses the "many" category for millions.
    expect(fr.projects.pageCount(1_000_000)).toBe('1\u202f000\u202f000 pages');
  });

  it('agree the verb with the count', () => {
    expect(de.order.emptySpreads(1)).toBe('1 Doppelseite hat keine Fotos und wird leer gedruckt.');
    expect(de.order.emptySpreads(2)).toBe('2 Doppelseiten haben keine Fotos und werden leer gedruckt.');
    expect(fr.order.emptySpreads(2)).toBe(
      '2 doubles pages ne contiennent aucune photo et seront imprimées vides.',
    );
  });
});

describe('number formatting', () => {
  it('formats percentages for each locale', () => {
    expect(en.zoom.value(125)).toBe('125%');
    expect(de.zoom.value(125)).toBe('125\u00a0%');
    expect(fr.zoom.value(125)).toBe('125\u00a0%');
  });
});

describe('French typography', () => {
  it('puts a no-break space before colons', () => {
    expect(fr.slot.label(2, 'Lac')).toBe('Emplacement 2\u00a0: Lac');
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
