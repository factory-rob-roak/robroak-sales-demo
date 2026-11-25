import type { LayoutId, SaveStatus } from '../../features/editor/types';
import type { BookFormat, CoverType } from '../../types';
import { createFormatters } from '../format';

const { number: n, percent: pct, plural } = createFormatters('en');

/** The source catalog. Every other locale must provide exactly these keys, with the same parameters. */
export const en = {
  common: {
    undo: 'Undo',
    redo: 'Redo',
  },
  layouts: {
    full: 'Full page',
    'two-up': 'Two up',
    'three-grid': 'Three grid',
    'four-grid': 'Four grid',
    collage: 'Collage',
  } satisfies Record<LayoutId, string>,
  toolbar: {
    back: 'Back to projects',
    untitled: 'Untitled book',
    history: 'History',
    save: {
      saved: 'All changes saved on this device',
      pending: 'Saving…',
      error: 'Could not save. Free up browser storage, or keep this tab open.',
    } satisfies Record<SaveStatus, string>,
  },
  canvas: {
    heading: (spread: number, count: number) => `Spread ${n(spread)} of ${n(count)}`,
    layout: 'Layout',
    hint: 'Drag a photo onto a slot, or select a photo in the tray and then choose a slot.',
    hintSelected: (photo: string) => `Choose a slot for ${photo}.`,
    placed: (photo: string, slot: number) => `Placed ${photo} in slot ${n(slot)}.`,
    caption: 'Caption',
    captionPlaceholder: 'Add a caption',
  },
  zoom: {
    label: 'Zoom',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    reset: 'Reset zoom',
    value: (percent: number) => pct(percent),
  },
  slot: {
    empty: 'empty',
    missing: (name: string) => `${name} (missing)`,
    label: (slot: number, photo: string) => `Slot ${n(slot)}: ${photo}`,
    place: (photo: string, slot: number) => `Place ${photo} in slot ${n(slot)}`,
    photoMissing: 'Photo missing',
    dropHere: 'Drop a photo here',
    remove: (slot: number) => `Remove photo from slot ${n(slot)}`,
  },
  photos: {
    reAdd: 'Re-add photo',
    reAddLabel: (name: string) => `Re-add photo ${name}`,
  },
  spreads: {
    heading: 'Pages',
    count: (spreads: number, pages: number) =>
      `${plural(spreads, { one: `${n(spreads)} spread`, other: `${n(spreads)} spreads` })} · ${plural(pages, { one: `${n(pages)} printed page`, other: `${n(pages)} printed pages` })}`,
    name: (spread: number) => `Spread ${n(spread)}`,
    pages: (first: number, last: number) => `Pages ${n(first)}–${n(last)}`,
    selectLabel: (spread: number, first: number, last: number) =>
      `Spread ${n(spread)}, pages ${n(first)}–${n(last)}`,
    moveUp: (spread: number) => `Move spread ${n(spread)} up`,
    moveDown: (spread: number) => `Move spread ${n(spread)} down`,
    delete: (spread: number) => `Delete spread ${n(spread)}`,
    deleted: (spread: number) => `Spread ${n(spread)} deleted.`,
    add: 'Add spread',
  },
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
