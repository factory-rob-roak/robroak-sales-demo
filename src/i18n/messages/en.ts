import type { BookFormat, CoverType } from '../../types';
import { createFormatters } from '../format';

const { number: n, plural } = createFormatters('en');

/** The source catalog. Every other locale must provide exactly these keys, with the same parameters. */
export const en = {
  formats: {
    'square-8': '8x8 Square',
    'landscape-11': '11x8.5 Landscape',
    'portrait-8x11': '8.5x11 Portrait',
  } satisfies Record<BookFormat, string>,
  covers: {
    softcover: 'Softcover',
    hardcover: 'Hardcover',
    layflat: 'Lay-flat',
  } satisfies Record<CoverType, string>,
  projects: {
    heading: 'Your photo books',
    listLabel: 'Projects',
    pageCount: (count: number) => plural(count, { one: `${n(count)} page`, other: `${n(count)} pages` }),
    open: (title: string) => `Open ${title}`,
    edited: (date: string) => `Edited ${date}`,
  },
};

export type Messages = typeof en;
