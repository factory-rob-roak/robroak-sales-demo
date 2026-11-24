import { describe, expect, it } from 'vitest';
import { MAX_SPREADS, createSpread } from './constants';
import { editorReducer, visibleSlots } from './editorReducer';
import type { BookDraft, EditorAction, Photo, Spread } from './types';

const photo = (id: string, extra: Partial<Photo> = {}): Photo => ({
  id,
  url: `https://img.test/${id}.jpg`,
  name: `${id}.jpg`,
  alt: '',
  ...extra,
});

function draft(spreads: Spread[] = [], photos: Photo[] = []): BookDraft {
  return {
    title: 'Trip',
    format: 'square-8',
    coverType: 'softcover',
    theme: 'classic',
    spreads: spreads.length ? spreads : [createSpread('a'), createSpread('b', 'two-up')],
    photos: photos.length ? photos : [photo('p1'), photo('p2'), photo('p3')],
  };
}

const ids = (state: BookDraft) => state.spreads.map((s) => s.id);
const run = (state: BookDraft, ...actions: EditorAction[]) => actions.reduce(editorReducer, state);

describe('visibleSlots', () => {
  it('pads to the layout slot count and hides extra entries', () => {
    expect(visibleSlots({ ...createSpread('x', 'two-up'), slots: ['p1'] })).toEqual(['p1', null]);
    expect(visibleSlots({ ...createSpread('x'), slots: ['p1', 'p2'] })).toEqual(['p1']);
  });
});

describe('spreads', () => {
  it('adds a spread at the end or at an index, clamped', () => {
    const s = draft();
    expect(ids(run(s, { type: 'addSpread', id: 'c' }))).toEqual(['a', 'b', 'c']);
    expect(ids(run(s, { type: 'addSpread', id: 'c', index: 1 }))).toEqual(['a', 'c', 'b']);
    expect(ids(run(s, { type: 'addSpread', id: 'c', index: -4 }))).toEqual(['c', 'a', 'b']);
    expect(ids(run(s, { type: 'addSpread', id: 'c', index: 99 }))).toEqual(['a', 'b', 'c']);
    expect(run(s, { type: 'addSpread', id: 'c' }).spreads[2]).toEqual(createSpread('c'));
  });

  it('refuses a duplicate id and more than 50 spreads', () => {
    const s = draft();
    expect(run(s, { type: 'addSpread', id: 'a' })).toBe(s);
    const full = draft(Array.from({ length: MAX_SPREADS }, (_, i) => createSpread(`s${i}`)));
    expect(run(full, { type: 'addSpread', id: 'extra' })).toBe(full);
  });

  it('deletes a spread but always keeps one', () => {
    const s = draft();
    const one = run(s, { type: 'deleteSpread', spreadId: 'a' });
    expect(ids(one)).toEqual(['b']);
    expect(run(one, { type: 'deleteSpread', spreadId: 'b' })).toBe(one);
    expect(run(s, { type: 'deleteSpread', spreadId: 'nope' })).toBe(s);
  });

  it('moves spreads up and down within bounds', () => {
    const s = draft([createSpread('a'), createSpread('b'), createSpread('c')]);
    expect(ids(run(s, { type: 'moveSpread', spreadId: 'b', direction: 'up' }))).toEqual(['b', 'a', 'c']);
    expect(ids(run(s, { type: 'moveSpread', spreadId: 'b', direction: 'down' }))).toEqual(['a', 'c', 'b']);
    expect(run(s, { type: 'moveSpread', spreadId: 'a', direction: 'up' })).toBe(s);
    expect(run(s, { type: 'moveSpread', spreadId: 'c', direction: 'down' })).toBe(s);
    expect(run(s, { type: 'moveSpread', spreadId: 'nope', direction: 'down' })).toBe(s);
  });

  it('moves a spread to an index, clamped', () => {
    const s = draft([createSpread('a'), createSpread('b'), createSpread('c')]);
    expect(ids(run(s, { type: 'moveSpreadTo', spreadId: 'a', index: 2 }))).toEqual(['b', 'c', 'a']);
    expect(ids(run(s, { type: 'moveSpreadTo', spreadId: 'c', index: -1 }))).toEqual(['c', 'a', 'b']);
    expect(ids(run(s, { type: 'moveSpreadTo', spreadId: 'a', index: 50 }))).toEqual(['b', 'c', 'a']);
    expect(run(s, { type: 'moveSpreadTo', spreadId: 'b', index: 1 })).toBe(s);
    expect(run(s, { type: 'moveSpreadTo', spreadId: 'nope', index: 0 })).toBe(s);
  });
});

describe('layouts and slots', () => {
  const collage = (): BookDraft => draft([{ ...createSpread('a', 'collage'), slots: ['p1', null, 'p2'] }]);

  it('keeps hidden photos when switching to a smaller layout and back', () => {
    const s = collage();
    const small = run(s, { type: 'setLayout', spreadId: 'a', layout: 'full' });
    expect(small.spreads[0]).toMatchObject({ layout: 'full', slots: ['p1', null, 'p2'] });
    const back = run(small, { type: 'setLayout', spreadId: 'a', layout: 'collage' });
    expect(back.spreads[0]).toEqual(s.spreads[0]);
    expect(run(s, { type: 'setLayout', spreadId: 'a', layout: 'collage' })).toBe(s);
  });

  it('places a photo in a visible slot, padding with empty slots', () => {
    const s = collage();
    const next = run(s, { type: 'placePhoto', target: { spreadId: 'a', slot: 4 }, photoId: 'p3' });
    expect(next.spreads[0]?.slots).toEqual(['p1', null, 'p2', null, 'p3']);
    expect(next.spreads[0]).not.toBe(s.spreads[0]);
  });

  it.each([
    ['unknown spread', { spreadId: 'nope', slot: 0 }, 'p3'],
    ['hidden slot', { spreadId: 'a', slot: 6 }, 'p3'],
    ['negative slot', { spreadId: 'a', slot: -1 }, 'p3'],
    ['fractional slot', { spreadId: 'a', slot: 1.5 }, 'p3'],
    ['unknown photo', { spreadId: 'a', slot: 1 }, 'nope'],
    ['same photo', { spreadId: 'a', slot: 0 }, 'p1'],
  ])('ignores placing into an invalid target (%s)', (_, target, photoId) => {
    const s = collage();
    expect(run(s, { type: 'placePhoto', target, photoId })).toBe(s);
  });

  it('removes a photo and trims trailing empty slots', () => {
    const s = collage();
    expect(run(s, { type: 'removePhoto', target: { spreadId: 'a', slot: 2 } }).spreads[0]?.slots).toEqual(['p1']);
    expect(run(s, { type: 'removePhoto', target: { spreadId: 'a', slot: 1 } })).toBe(s);
    expect(run(s, { type: 'removePhoto', target: { spreadId: 'a', slot: 9 } })).toBe(s);
  });

  it('swaps slots within and across spreads, including with an empty slot', () => {
    const s = draft([
      { ...createSpread('a', 'two-up'), slots: ['p1', 'p2'] },
      { ...createSpread('b', 'two-up'), slots: ['p3'] },
    ]);
    const within = run(s, { type: 'swapSlots', from: { spreadId: 'a', slot: 0 }, to: { spreadId: 'a', slot: 1 } });
    expect(within.spreads[0]?.slots).toEqual(['p2', 'p1']);
    const across = run(s, { type: 'swapSlots', from: { spreadId: 'a', slot: 1 }, to: { spreadId: 'b', slot: 1 } });
    expect(across.spreads.map((x) => x.slots)).toEqual([['p1'], ['p3', 'p2']]);
    expect(run(s, { type: 'swapSlots', from: { spreadId: 'a', slot: 0 }, to: { spreadId: 'a', slot: 0 } })).toBe(s);
    expect(run(s, { type: 'swapSlots', from: { spreadId: 'a', slot: 0 }, to: { spreadId: 'b', slot: 5 } })).toBe(s);
    expect(run(s, { type: 'swapSlots', from: { spreadId: 'x', slot: 0 }, to: { spreadId: 'b', slot: 0 } })).toBe(s);
  });
});

describe('autoFill', () => {
  it('fills empty visible slots across spreads with unused photos, in order', () => {
    const s = draft(
      [
        { ...createSpread('a', 'two-up'), slots: [null, 'p2'] },
        { ...createSpread('b', 'full'), slots: [null, 'p5'] },
        { ...createSpread('c', 'two-up'), slots: [] },
      ],
      [photo('p1'), photo('p2'), photo('p3', { missing: true }), photo('p4'), photo('p5'), photo('p6')],
    );
    const next = run(s, { type: 'autoFill' });
    // p2 and p5 are already used (p5 in a hidden slot); p3 is missing.
    expect(next.spreads.map((x) => x.slots)).toEqual([['p1', 'p2'], ['p4', 'p5'], ['p6']]);
    expect(next.spreads[1]).not.toBe(s.spreads[1]);
  });

  it('changes nothing when there are no unused photos or no empty slots', () => {
    const used = draft([{ ...createSpread('a', 'two-up'), slots: ['p1'] }], [photo('p1')]);
    expect(run(used, { type: 'autoFill' })).toBe(used);
    const filled = draft([{ ...createSpread('a'), slots: ['p1'] }], [photo('p1'), photo('p2')]);
    expect(run(filled, { type: 'autoFill' })).toBe(filled);
  });
});

describe('book settings', () => {
  it.each<[EditorAction, Partial<BookDraft>]>([
    [{ type: 'setTitle', title: 'Summer' }, { title: 'Summer' }],
    [{ type: 'setTheme', theme: 'kraft' }, { theme: 'kraft' }],
    [{ type: 'setFormat', format: 'landscape-11' }, { format: 'landscape-11' }],
    [{ type: 'setCoverType', coverType: 'layflat' }, { coverType: 'layflat' }],
  ])('applies %j and ignores the same value twice', (action, expected) => {
    const s = draft();
    const next = run(s, action);
    expect(next).toEqual({ ...s, ...expected });
    expect(run(next, action)).toBe(next);
  });

  it('sets a caption on one spread', () => {
    const s = draft();
    const next = run(s, { type: 'setCaption', spreadId: 'b', caption: 'Beach' });
    expect(next.spreads.map((x) => x.caption)).toEqual(['', 'Beach']);
    expect(next.spreads[0]).toBe(s.spreads[0]);
    expect(run(next, { type: 'setCaption', spreadId: 'b', caption: 'Beach' })).toBe(next);
    expect(run(s, { type: 'setCaption', spreadId: 'nope', caption: 'x' })).toBe(s);
  });
});

describe('photos', () => {
  it('adds new photos and skips ids it already has', () => {
    const s = draft();
    const next = run(s, { type: 'addPhotos', photos: [photo('p1'), photo('p9'), photo('p9', { name: 'dup' })] });
    expect(next.photos.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p9']);
    expect(next.photos[3]?.name).toBe('p9.jpg');
    expect(run(s, { type: 'addPhotos', photos: [photo('p2')] })).toBe(s);
  });

  it('edits alt text', () => {
    const s = draft();
    const next = run(s, { type: 'setPhotoAlt', photoId: 'p2', alt: 'Dog on a beach' });
    expect(next.photos[1]?.alt).toBe('Dog on a beach');
    expect(next.photos[0]).toBe(s.photos[0]);
    expect(run(next, { type: 'setPhotoAlt', photoId: 'p2', alt: 'Dog on a beach' })).toBe(next);
    expect(run(s, { type: 'setPhotoAlt', photoId: 'nope', alt: 'x' })).toBe(s);
  });

  it('replaces a missing photo in place, keeping its id, alt text, and slots', () => {
    const s = draft(
      [{ ...createSpread('a'), slots: ['p1'] }],
      [photo('p1', { url: 'blob:old', alt: 'Grandma', missing: true })],
    );
    const next = run(s, { type: 'replacePhoto', photoId: 'p1', url: 'blob:new', name: 'new.jpg' });
    expect(next.photos).toEqual([{ id: 'p1', url: 'blob:new', name: 'new.jpg', alt: 'Grandma' }]);
    expect(next.spreads).toBe(s.spreads);
    expect(run(s, { type: 'replacePhoto', photoId: 'nope', url: 'x', name: 'x' })).toBe(s);
  });
});
