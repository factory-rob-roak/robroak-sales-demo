import { createStubLogger } from '../../api/createStubLogger';
import type { Logger } from '../../api/logger';
import { COVER_LABELS, FORMAT_LABELS } from '../../types';
import { LAYOUT_SLOT_COUNT, MAX_SLOTS, MAX_SPREADS, THEMES } from './constants';
import type { BookDraft, Photo, Spread, ThemeId } from './types';

export const STORAGE_KEY = 'photo-book-editor:draft';
export const STORAGE_VERSION = 1;

/** Upgrades saved data from version n (the record key) to version n + 1. */
export type Migration = (data: unknown) => unknown;

/** Add an entry here whenever STORAGE_VERSION goes up. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export type LoadResult =
  | { status: 'loaded'; draft: BookDraft }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'unavailable' };

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };

export interface DraftStorage {
  load(): LoadResult;
  save(draft: BookDraft): SaveResult;
}

export interface DraftStorageOptions {
  storage?: Storage | null;
  key?: string;
  version?: number;
  migrations?: Readonly<Record<number, Migration>>;
  /** Receives read and write failures. Never receives draft content. */
  logger?: Logger;
}

/** Reading `window.localStorage` itself throws in some privacy modes. */
export function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isKeyOf<T extends object>(table: T, value: unknown): value is keyof T {
  return typeof value === 'string' && Object.hasOwn(table, value);
}

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

function parsePhoto(value: unknown): Photo | null {
  if (!isRecord(value)) return null;
  const { id, url, name, alt, missing } = value;
  if (typeof id !== 'string' || id === '' || typeof url !== 'string') return null;
  if (typeof name !== 'string' || typeof alt !== 'string') return null;
  if (missing !== undefined && typeof missing !== 'boolean') return null;
  // Object URLs from an earlier page load no longer resolve.
  const isMissing = missing === true || url.startsWith('blob:');
  return isMissing ? { id, url, name, alt, missing: true } : { id, url, name, alt };
}

function parseSpread(value: unknown, photoIds: Set<string>): Spread | null {
  if (!isRecord(value)) return null;
  const { id, layout, slots, caption } = value;
  if (typeof id !== 'string' || id === '' || !isKeyOf(LAYOUT_SLOT_COUNT, layout)) return null;
  if (typeof caption !== 'string' || !Array.isArray(slots) || slots.length > MAX_SLOTS) return null;
  const cleaned: Array<string | null> = [];
  for (const slot of slots) {
    if (slot !== null && typeof slot !== 'string') return null;
    // A slot pointing at a photo we no longer have is shown as empty.
    cleaned.push(slot !== null && photoIds.has(slot) ? slot : null);
  }
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === null) cleaned.pop();
  return { id, layout, slots: cleaned, caption };
}

function parseList<T extends { id: string }>(value: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    const item = parse(raw);
    if (item === null || ids.has(item.id)) return null;
    ids.add(item.id);
    items.push(item);
  }
  return items;
}

/** Validates untrusted data as a BookDraft, returning null if it is not one. */
export function parseDraft(value: unknown): BookDraft | null {
  if (!isRecord(value)) return null;
  const { title, format, coverType, theme } = value;
  if (typeof title !== 'string' || !isKeyOf(FORMAT_LABELS, format)) return null;
  if (!isKeyOf(COVER_LABELS, coverType) || !isThemeId(theme)) return null;
  const photos = parseList(value.photos, parsePhoto);
  if (photos === null) return null;
  const photoIds = new Set(photos.map((p) => p.id));
  const spreads = parseList(value.spreads, (s) => parseSpread(s, photoIds));
  if (spreads === null || spreads.length === 0 || spreads.length > MAX_SPREADS) return null;
  return { title, format, coverType, theme, spreads, photos };
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export function createDraftStorage({
  storage = getLocalStorage(),
  key = STORAGE_KEY,
  version = STORAGE_VERSION,
  migrations = MIGRATIONS,
  logger = createStubLogger(),
}: DraftStorageOptions = {}): DraftStorage {
  // Autosave retries on every edit, so only the first failure in a row is reported.
  let saveFailing = false;

  function migrate(saved: number, data: unknown): unknown {
    let current = data;
    for (let v = saved; v < version; v++) {
      const step = migrations[v];
      if (step === undefined) return null;
      current = step(current);
    }
    return current;
  }

  function unreadable(status: 'invalid' | 'unavailable', reason: string, error?: unknown): LoadResult {
    logger[status === 'invalid' ? 'error' : 'warn']('Saved draft could not be read', { reason }, error);
    return { status };
  }

  function parseEnvelope(raw: string): LoadResult {
    let envelope: unknown;
    try {
      envelope = JSON.parse(raw);
    } catch {
      // The parser's message quotes the saved text, which is user content.
      return unreadable('invalid', 'bad-json');
    }
    if (!isRecord(envelope)) return unreadable('invalid', 'bad-envelope');
    const saved = envelope.version;
    if (typeof saved !== 'number' || !Number.isInteger(saved) || saved < 1 || saved > version) {
      return unreadable('invalid', 'bad-version');
    }
    let migrated: unknown;
    try {
      migrated = migrate(saved, envelope.draft);
    } catch (error) {
      return unreadable('invalid', 'migration-failed', error);
    }
    const draft = parseDraft(migrated);
    return draft === null ? unreadable('invalid', 'bad-draft') : { status: 'loaded', draft };
  }

  function write(draft: BookDraft): SaveResult {
    if (storage === null) return { ok: false, reason: 'unavailable' };
    try {
      storage.setItem(key, JSON.stringify({ version, draft }));
      return { ok: true };
    } catch (error) {
      const reason = isQuotaError(error) ? 'quota' : 'unavailable';
      if (!saveFailing) logger.error('Draft could not be saved', { reason }, error);
      return { ok: false, reason };
    }
  }

  return {
    load() {
      if (storage === null) return unreadable('unavailable', 'no-storage');
      let raw: string | null;
      try {
        raw = storage.getItem(key);
      } catch (error) {
        return unreadable('unavailable', 'read-failed', error);
      }
      return raw === null ? { status: 'empty' } : parseEnvelope(raw);
    },

    save(draft) {
      const result = write(draft);
      saveFailing = !result.ok;
      return result;
    },
  };
}
