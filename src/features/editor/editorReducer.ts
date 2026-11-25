import { LAYOUT_SLOT_COUNT, MAX_SPREADS, createSpread } from './constants';
import { clampGiftMessage } from './giftMessage';
import type { BookDraft, EditorAction, Photo, SlotRef, Spread } from './types';

/** Photo ids shown in a spread's current layout, with `null` for empty slots. */
export function visibleSlots(spread: Spread): Array<string | null> {
  const count = LAYOUT_SLOT_COUNT[spread.layout];
  return Array.from({ length: count }, (_, i) => spread.slots[i] ?? null);
}

function withSlot(slots: Array<string | null>, index: number, value: string | null) {
  const next = [...slots];
  while (next.length < index) next.push(null);
  next[index] = value;
  while (next.length > 0 && next[next.length - 1] === null) next.pop();
  return next;
}

function findSpread(state: BookDraft, id: string): Spread | undefined {
  return state.spreads.find((s) => s.id === id);
}

function isVisibleSlot(state: BookDraft, ref: SlotRef): boolean {
  const spread = findSpread(state, ref.spreadId);
  return (
    spread !== undefined &&
    Number.isInteger(ref.slot) &&
    ref.slot >= 0 &&
    ref.slot < LAYOUT_SLOT_COUNT[spread.layout]
  );
}

function readSlot(state: BookDraft, ref: SlotRef): string | null {
  return findSpread(state, ref.spreadId)?.slots[ref.slot] ?? null;
}

function mapSpreads(state: BookDraft, fn: (spread: Spread) => Spread): BookDraft {
  let changed = false;
  const spreads = state.spreads.map((s) => {
    const next = fn(s);
    if (next !== s) changed = true;
    return next;
  });
  return changed ? { ...state, spreads } : state;
}

function writeSlots(state: BookDraft, writes: Array<[SlotRef, string | null]>): BookDraft {
  return mapSpreads(state, (spread) =>
    writes.reduce(
      (s, [ref, value]) =>
        ref.spreadId === s.id ? { ...s, slots: withSlot(s.slots, ref.slot, value) } : s,
      spread,
    ),
  );
}

function updatePhoto(state: BookDraft, id: string, fn: (photo: Photo) => Photo): BookDraft {
  let changed = false;
  const photos = state.photos.map((p) => {
    const next = p.id === id ? fn(p) : p;
    if (next !== p) changed = true;
    return next;
  });
  return changed ? { ...state, photos } : state;
}

function moveSpread(state: BookDraft, id: string, toIndex: number): BookDraft {
  const from = state.spreads.findIndex((s) => s.id === id);
  const to = Math.min(Math.max(Math.trunc(toIndex), 0), state.spreads.length - 1);
  if (from === -1 || from === to) return state;
  const spreads = [...state.spreads];
  spreads.splice(to, 0, ...spreads.splice(from, 1));
  return { ...state, spreads };
}

function autoFill(state: BookDraft): BookDraft {
  const used = new Set(state.spreads.flatMap((s) => s.slots));
  const queue = state.photos.filter((p) => !p.missing && !used.has(p.id)).map((p) => p.id);
  return mapSpreads(state, (spread) => {
    let slots = spread.slots;
    visibleSlots(spread).forEach((photoId, i) => {
      const next = photoId === null ? queue.shift() : undefined;
      if (next !== undefined) slots = withSlot(slots, i, next);
    });
    return slots === spread.slots ? spread : { ...spread, slots };
  });
}

/**
 * Pure reducer for the book draft. Actions that would not change anything
 * (invalid ids, out-of-range slots, same values) return the same state object,
 * so callers can skip history entries and saves.
 */
export function editorReducer(state: BookDraft, action: EditorAction): BookDraft {
  switch (action.type) {
    case 'addSpread': {
      if (state.spreads.length >= MAX_SPREADS || findSpread(state, action.id)) return state;
      const index = Math.min(Math.max(action.index ?? state.spreads.length, 0), state.spreads.length);
      const spreads = [...state.spreads];
      spreads.splice(index, 0, createSpread(action.id));
      return { ...state, spreads };
    }
    case 'deleteSpread':
      // A book always keeps one spread so the canvas has something to show.
      if (state.spreads.length <= 1 || !findSpread(state, action.spreadId)) return state;
      return { ...state, spreads: state.spreads.filter((s) => s.id !== action.spreadId) };
    case 'moveSpread': {
      const from = state.spreads.findIndex((s) => s.id === action.spreadId);
      const to = action.direction === 'up' ? from - 1 : from + 1;
      if (from === -1 || to < 0 || to >= state.spreads.length) return state;
      return moveSpread(state, action.spreadId, to);
    }
    case 'moveSpreadTo':
      return moveSpread(state, action.spreadId, action.index);
    case 'setLayout':
      return mapSpreads(state, (s) =>
        s.id === action.spreadId && s.layout !== action.layout ? { ...s, layout: action.layout } : s,
      );
    case 'placePhoto':
      if (!isVisibleSlot(state, action.target) || !state.photos.some((p) => p.id === action.photoId)) {
        return state;
      }
      if (readSlot(state, action.target) === action.photoId) return state;
      return writeSlots(state, [[action.target, action.photoId]]);
    case 'removePhoto':
      if (!isVisibleSlot(state, action.target) || readSlot(state, action.target) === null) return state;
      return writeSlots(state, [[action.target, null]]);
    case 'swapSlots': {
      if (!isVisibleSlot(state, action.from) || !isVisibleSlot(state, action.to)) return state;
      const a = readSlot(state, action.from);
      const b = readSlot(state, action.to);
      if (a === b) return state;
      return writeSlots(state, [
        [action.from, b],
        [action.to, a],
      ]);
    }
    case 'autoFill':
      return autoFill(state);
    case 'setCaption':
      return mapSpreads(state, (s) =>
        s.id === action.spreadId && s.caption !== action.caption ? { ...s, caption: action.caption } : s,
      );
    case 'setTheme':
      return state.theme === action.theme ? state : { ...state, theme: action.theme };
    case 'setTitle':
      return state.title === action.title ? state : { ...state, title: action.title };
    case 'setFormat':
      return state.format === action.format ? state : { ...state, format: action.format };
    case 'setCoverType':
      return state.coverType === action.coverType ? state : { ...state, coverType: action.coverType };
    case 'setGiftMessage': {
      const giftMessage = clampGiftMessage(action.message);
      return state.giftMessage === giftMessage ? state : { ...state, giftMessage };
    }
    case 'removeGiftMessage':
      return state.giftMessage === '' ? state : { ...state, giftMessage: '' };
    case 'addPhotos': {
      const known = new Set(state.photos.map((p) => p.id));
      const added: Photo[] = [];
      for (const photo of action.photos) {
        if (known.has(photo.id)) continue;
        known.add(photo.id);
        added.push(photo);
      }
      return added.length === 0 ? state : { ...state, photos: [...state.photos, ...added] };
    }
    case 'setPhotoAlt':
      return updatePhoto(state, action.photoId, (p) => (p.alt === action.alt ? p : { ...p, alt: action.alt }));
    case 'replacePhoto':
      return updatePhoto(state, action.photoId, ({ id, alt }) => ({
        id,
        alt,
        url: action.url,
        name: action.name,
      }));
  }
}
