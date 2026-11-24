import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LAYOUTS,
  LAYOUT_SLOT_COUNT,
  MAX_SLOTS,
  MAX_SPREADS,
  THEMES,
  createDefaultDraft,
  createId,
  createSpread,
} from './constants';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('editor constants', () => {
  it('caps a book at 50 spreads (100 printed pages)', () => {
    expect(MAX_SPREADS).toBe(50);
  });

  it('keeps the layout list and slot counts in agreement', () => {
    for (const layout of LAYOUTS) {
      expect(LAYOUT_SLOT_COUNT[layout.id]).toBe(layout.slotCount);
    }
    expect(LAYOUTS.map((l) => l.id)).toEqual(Object.keys(LAYOUT_SLOT_COUNT));
    expect(MAX_SLOTS).toBe(6);
  });

  it('lists four themes', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['classic', 'modern', 'kraft', 'pastel']);
  });
});

describe('createId', () => {
  it('returns unique UUIDs', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });

  it('falls back to getRandomValues when randomUUID is missing', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => arr.fill(0xff),
    });
    expect(createId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(createId()).toMatch(UUID_V4);
  });
});

describe('createDefaultDraft', () => {
  it('starts with two empty spreads and default settings', () => {
    let n = 0;
    const draft = createDefaultDraft(() => `id-${++n}`);
    expect(draft).toEqual({
      title: 'My Photo Book',
      format: 'square-8',
      coverType: 'softcover',
      theme: 'classic',
      spreads: [
        { id: 'id-1', layout: 'full', slots: [], caption: '' },
        { id: 'id-2', layout: 'two-up', slots: [], caption: '' },
      ],
      photos: [],
    });
  });

  it('uses random ids by default', () => {
    const [a, b] = createDefaultDraft().spreads;
    expect(a?.id).toMatch(UUID_V4);
    expect(a?.id).not.toBe(b?.id);
  });

  it('creates a full-page spread unless told otherwise', () => {
    expect(createSpread('x').layout).toBe('full');
    expect(createSpread('x', 'collage').layout).toBe('collage');
  });
});
