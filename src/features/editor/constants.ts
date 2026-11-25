import { MAX_PAGES } from '../../lib/pricing';
import type { BookDraft, LayoutId, Spread, ThemeId } from './types';

export const PAGES_PER_SPREAD = 2;

/** 100 printed pages is the most we print. */
export const MAX_SPREADS = MAX_PAGES / PAGES_PER_SPREAD;

export interface LayoutDefinition {
  id: LayoutId;
  label: string;
  slotCount: number;
}

export const LAYOUTS: readonly LayoutDefinition[] = [
  { id: 'full', label: 'Full page', slotCount: 1 },
  { id: 'two-up', label: 'Two up', slotCount: 2 },
  { id: 'three-grid', label: 'Three grid', slotCount: 3 },
  { id: 'four-grid', label: 'Four grid', slotCount: 4 },
  { id: 'collage', label: 'Collage', slotCount: 6 },
];

export const LAYOUT_SLOT_COUNT: Record<LayoutId, number> = {
  full: 1,
  'two-up': 2,
  'three-grid': 3,
  'four-grid': 4,
  collage: 6,
};

/** The most slot entries any spread can hold, so no layout loses photos. */
export const MAX_SLOTS = Math.max(...Object.values(LAYOUT_SLOT_COUNT));

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
}

export const THEMES: readonly ThemeDefinition[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'modern', label: 'Modern' },
  { id: 'kraft', label: 'Kraft' },
  { id: 'pastel', label: 'Pastel' },
];

export const DEFAULT_TITLE = 'My Photo Book';

export const GIFT_MESSAGE_MAX_LENGTH = 300;

export type IdGenerator = () => string;

/** Random UUID v4. Falls back to getRandomValues outside secure contexts, where randomUUID is missing. */
export const createId: IdGenerator = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const variant = ((parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20)}`;
};

export function createSpread(id: string, layout: LayoutId = 'full'): Spread {
  return { id, layout, slots: [], caption: '' };
}

export function createDefaultDraft(newId: IdGenerator = createId): BookDraft {
  return {
    title: DEFAULT_TITLE,
    format: 'square-8',
    coverType: 'softcover',
    theme: 'classic',
    giftMessage: '',
    spreads: [createSpread(newId(), 'full'), createSpread(newId(), 'two-up')],
    photos: [],
  };
}
