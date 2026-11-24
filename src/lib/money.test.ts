import { expect, it } from 'vitest';
import { formatCents } from './money';

it('formats integer cents as US dollars', () => {
  expect(formatCents(4499)).toBe('$44.99');
  expect(formatCents(0)).toBe('$0.00');
});
