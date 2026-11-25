import { expect, it } from 'vitest';
import { formatCents } from './money';

it('formats integer cents as US dollars', () => {
  expect(formatCents(4499)).toBe('$44.99');
  expect(formatCents(0)).toBe('$0.00');
});

it('formats US dollars with the conventions of the given locale', () => {
  expect(formatCents(4499, 'en-US')).toBe('$44.99');
  expect(formatCents(123456, 'de-DE')).toBe('1.234,56\u00a0$');
  expect(formatCents(4499, 'fr-FR')).toBe('44,99\u00a0$US');
});
