import type { BookFormat, CoverType } from '../../types';

export type LayoutId = 'full' | 'two-up' | 'three-grid' | 'four-grid' | 'collage';

export type ThemeId = 'classic' | 'modern' | 'kraft' | 'pastel';

export interface Photo {
  id: string;
  url: string;
  name: string;
  alt: string;
  /** Set when the image behind `url` no longer loads (for example a blob: URL after a reload). */
  missing?: boolean;
}

/**
 * One spread is two printed pages. `slots` holds photo ids and may be longer
 * than the layout's slot count: entries past the visible count are kept so
 * switching to a smaller layout and back restores the photos.
 */
export interface Spread {
  id: string;
  layout: LayoutId;
  slots: Array<string | null>;
  caption: string;
}

export interface BookDraft {
  title: string;
  format: BookFormat;
  coverType: CoverType;
  theme: ThemeId;
  spreads: Spread[];
  photos: Photo[];
}

export interface SlotRef {
  spreadId: string;
  slot: number;
}

export type EditorAction =
  | { type: 'addSpread'; id: string; index?: number }
  | { type: 'deleteSpread'; spreadId: string }
  | { type: 'moveSpread'; spreadId: string; direction: 'up' | 'down' }
  | { type: 'moveSpreadTo'; spreadId: string; index: number }
  | { type: 'setLayout'; spreadId: string; layout: LayoutId }
  | { type: 'placePhoto'; target: SlotRef; photoId: string }
  | { type: 'removePhoto'; target: SlotRef }
  | { type: 'swapSlots'; from: SlotRef; to: SlotRef }
  | { type: 'autoFill' }
  | { type: 'setCaption'; spreadId: string; caption: string }
  | { type: 'setTheme'; theme: ThemeId }
  | { type: 'setTitle'; title: string }
  | { type: 'setFormat'; format: BookFormat }
  | { type: 'setCoverType'; coverType: CoverType }
  | { type: 'addPhotos'; photos: Photo[] }
  | { type: 'setPhotoAlt'; photoId: string; alt: string }
  /** Points an existing photo at a new upload, keeping its id and slot references. */
  | { type: 'replacePhoto'; photoId: string; url: string; name: string };

/** `pending` while an autosave is scheduled, `error` when the last save failed. */
export type SaveStatus = 'saved' | 'pending' | 'error';

/** What `useEditor` returns to the UI. */
export interface EditorController {
  draft: BookDraft;
  dispatch: (action: EditorAction) => void;
  /** Adds an empty spread at `index` (default: the end) with a fresh id. */
  addSpread: (index?: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
}
