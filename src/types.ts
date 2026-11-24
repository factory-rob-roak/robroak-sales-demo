export type BookFormat = 'square-8' | 'landscape-11' | 'portrait-8x11';

export type CoverType = 'softcover' | 'hardcover' | 'layflat';

export interface BookSpec {
  format: BookFormat;
  pageCount: number;
  coverType: CoverType;
}

export interface Project extends BookSpec {
  id: string;
  title: string;
  updatedAt: string;
}

export const FORMAT_LABELS: Record<BookFormat, string> = {
  'square-8': '8x8 Square',
  'landscape-11': '11x8.5 Landscape',
  'portrait-8x11': '8.5x11 Portrait',
};

export const COVER_LABELS: Record<CoverType, string> = {
  softcover: 'Softcover',
  hardcover: 'Hardcover',
  layflat: 'Lay-flat',
};
