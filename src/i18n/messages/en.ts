import type { PhotoUploadErrorCode } from '../../api/photoUpload';
import type { LayoutId, SaveStatus, ThemeId } from '../../features/editor/types';
import type { BookFormat, CoverType } from '../../types';
import { createFormatters } from '../format';

const { number: n, percent: pct, plural } = createFormatters('en');
const pages = (count: number) => plural(count, { one: `${n(count)} page`, other: `${n(count)} pages` });

/** The source catalog. Every other locale must provide exactly these keys, with the same parameters. */
export const en = {
  themes: {
    classic: 'Classic',
    modern: 'Modern',
    kraft: 'Kraft',
    pastel: 'Pastel',
  } satisfies Record<ThemeId, string>,
  settings: {
    heading: 'Book settings',
    title: 'Title',
    theme: 'Theme',
    size: 'Size',
    cover: 'Cover',
  },
  tray: {
    heading: (count: number) => `Photos (${n(count)})`,
    addPhotos: 'Add photos',
    replacement: 'Replacement photo',
    autoFill: 'Auto-fill empty slots',
    empty: 'Add photos to start filling your book.',
    library: 'Photo library',
    selected: (photo: string) => `Selected ${photo}. Choose a slot on the page.`,
    missing: (name: string) => `${name} is missing`,
    inBook: 'In book',
    inBookLabel: (photo: string) => `${photo}, in book`,
    description: (name: string) => `Description of ${name}`,
    clearSelection: 'Clear selection',
    fallbackAlt: 'Photo',
  },
  uploads: {
    progress: (count: number) =>
      plural(count, { one: `Uploading ${n(count)} photo…`, other: `Uploading ${n(count)} photos…` }),
    problems: 'Upload problems',
    dismiss: 'Dismiss',
    dismissLabel: (message: string) => `Dismiss: ${message}`,
    errors: {
      'unsupported-type': (file: string) => `${file} is not a supported image. Use JPEG, PNG, WebP, or GIF.`,
      'too-large': (file: string) => `${file} is too large to upload.`,
      network: (file: string) => `${file} could not be uploaded. Try again.`,
      aborted: (file: string) => `Upload of ${file} was canceled.`,
    } satisfies Record<PhotoUploadErrorCode, (file: string) => string>,
  },
  order: {
    heading: 'Order summary',
    hidePrice: 'Hide price',
    showPrice: 'Show price',
    priceDetails: 'Price details',
    book: (count: number, format: string, cover: string) => `${pages(count)} · ${format} · ${cover}`,
    startsAt: (price: string, count: number) => `Books start at ${price} for ${pages(count)}.`,
    noPrice: 'The price appears once the page count can be printed.',
    total: 'Total',
    base: (count: number) => `Book with ${pages(count)}`,
    extraPages: (count: number) =>
      plural(count, { one: `${n(count)} extra page`, other: `${n(count)} extra pages` }),
    coverUpgrade: (cover: string) => `${cover} upgrade`,
    tooFewPages: (needed: number, minimum: number) =>
      `Add ${plural(needed, { one: `${n(needed)} more page`, other: `${n(needed)} more pages` })} to reach the ${n(minimum)}-page minimum.`,
    tooManyPages: (maximum: number, over: number) =>
      `Books can have at most ${pages(maximum)}. Remove ${pages(over)}.`,
    unpriceable: (reason: string) => `This book can't be printed yet: ${reason}.`,
    cantOrder: (issue: string) => `You can't order yet. ${issue}`,
    orderBook: 'Order book',
    emptySpreads: (count: number) =>
      plural(count, {
        one: `${n(count)} spread has no photos and will print blank.`,
        other: `${n(count)} spreads have no photos and will print blank.`,
      }),
    orderAnyway: 'Order anyway',
    keepEditing: 'Keep editing',
    ready: (book: string, price: string) => `Ready to order: ${book} · ${price}`,
  },
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
    language: 'Language',
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
    pageCount: pages,
    open: (title: string) => `Open ${title}`,
    edited: (date: string) => `Edited ${date}`,
  },
};

export type Messages = typeof en;
