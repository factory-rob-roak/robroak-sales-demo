import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStubLogger } from '../../api/createStubLogger';
import type { LogEntry } from '../../api/logger';
import { createSpread } from './constants';
import { STORAGE_KEY, createDraftStorage, getLocalStorage, parseDraft } from './storage';
import type { BookDraft } from './types';

const draft: BookDraft = {
  title: 'Summer',
  format: 'landscape-11',
  coverType: 'hardcover',
  theme: 'kraft',
  spreads: [{ ...createSpread('s1', 'two-up'), slots: ['p1', 'p2'], caption: 'Beach' }, createSpread('s2')],
  photos: [
    { id: 'p1', url: 'https://img.test/1.jpg', name: '1.jpg', alt: 'Dog' },
    { id: 'p2', url: 'https://img.test/2.jpg', name: '2.jpg', alt: '' },
  ],
};

const saved = (data: unknown, version: unknown = 1) => JSON.stringify({ version, draft: data });

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createDraftStorage', () => {
  it('saves and loads a draft from localStorage by default', () => {
    const storage = createDraftStorage();
    expect(storage.load()).toEqual({ status: 'empty' });
    expect(storage.save(draft)).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({ version: 1, draft });
    expect(storage.load()).toEqual({ status: 'loaded', draft });
  });

  it.each([
    ['bad JSON', '{oops'],
    ['an array', '[]'],
    ['no version', JSON.stringify({ draft })],
    ['a string version', saved(draft, '1')],
    ['a fractional version', saved(draft, 1.5)],
    ['version 0', saved(draft, 0)],
    ['a newer version', saved(draft, 2)],
    ['an invalid draft', saved({ ...draft, theme: 'neon' })],
  ])('reports invalid data for %s', (_, raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(createDraftStorage().load()).toEqual({ status: 'invalid' });
  });

  it('runs migrations from the saved version up to the current one', () => {
    const { title, ...v1 } = draft;
    localStorage.setItem(STORAGE_KEY, saved({ ...v1, name: title }));
    const storage = createDraftStorage({
      version: 3,
      migrations: {
        1: (data) => (typeof data === 'object' && data !== null ? { ...data, title: 'renamed' } : data),
        2: (data) => (typeof data === 'object' && data !== null ? { ...data, theme: 'modern' } : data),
      },
    });
    expect(storage.load()).toEqual({ status: 'loaded', draft: { ...draft, title: 'renamed', theme: 'modern' } });
  });

  it('reports invalid data when a migration is missing or throws', () => {
    localStorage.setItem(STORAGE_KEY, saved(draft));
    expect(createDraftStorage({ version: 2, migrations: {} }).load()).toEqual({ status: 'invalid' });
    const throwing = createDraftStorage({
      version: 2,
      migrations: {
        1: () => {
          throw new Error('boom');
        },
      },
    });
    expect(throwing.load()).toEqual({ status: 'invalid' });
  });

  it('reports unavailable storage instead of throwing', () => {
    const none = createDraftStorage({ storage: null });
    expect(none.load()).toEqual({ status: 'unavailable' });
    expect(none.save(draft)).toEqual({ ok: false, reason: 'unavailable' });

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(createDraftStorage().load()).toEqual({ status: 'unavailable' });
  });

  it.each([
    [new DOMException('full', 'QuotaExceededError'), 'quota'],
    [new DOMException('full', 'NS_ERROR_DOM_QUOTA_REACHED'), 'quota'],
    [new DOMException('denied', 'SecurityError'), 'unavailable'],
    [new Error('other'), 'unavailable'],
  ])('reports a failed save (%s) instead of throwing', (error, reason) => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });
    expect(createDraftStorage().save(draft)).toEqual({ ok: false, reason });
  });

  it('uses a custom key', () => {
    createDraftStorage({ key: 'other' }).save(draft);
    expect(localStorage.getItem('other')).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('createDraftStorage logging', () => {
  function logged() {
    const entries: LogEntry[] = [];
    const logger = createStubLogger({ onEntry: (entry) => entries.push(entry) });
    return { logger, entries };
  }
  const summary = (entries: LogEntry[]) =>
    entries.map(({ level, message, context, error }) => ({ level, message, context, error: error?.name }));

  it.each([
    ['bad-json', '{"title":"My secret trip"'],
    ['bad-envelope', '[]'],
    ['bad-version', saved(draft, 2)],
    ['bad-draft', saved({ ...draft, theme: 'neon' })],
  ])('reports %s as an unreadable draft without its content', (reason, raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    const { logger, entries } = logged();
    createDraftStorage({ logger }).load();
    expect(summary(entries)).toEqual([
      { level: 'error', message: 'Saved draft could not be read', context: { reason }, error: undefined },
    ]);
    expect(JSON.stringify(entries)).not.toContain('secret');
  });

  it('reports a migration that throws with its error', () => {
    localStorage.setItem(STORAGE_KEY, saved(draft));
    const { logger, entries } = logged();
    const migrations = {
      1: () => {
        throw new RangeError('bad step');
      },
    };
    createDraftStorage({ logger, version: 2, migrations }).load();
    expect(summary(entries)).toEqual([
      {
        level: 'error',
        message: 'Saved draft could not be read',
        context: { reason: 'migration-failed' },
        error: 'RangeError',
      },
    ]);
  });

  it('warns when storage is missing or cannot be read, and logs nothing for a clean load', () => {
    const { logger, entries } = logged();
    createDraftStorage({ logger }).load();
    createDraftStorage({ logger, storage: null }).load();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    createDraftStorage({ logger }).load();
    expect(summary(entries)).toEqual([
      { level: 'warn', message: 'Saved draft could not be read', context: { reason: 'no-storage' }, error: undefined },
      {
        level: 'warn',
        message: 'Saved draft could not be read',
        context: { reason: 'read-failed' },
        error: 'SecurityError',
      },
    ]);
  });

  it('reports the first failed save in a row, and again after a save succeeds', () => {
    const { logger, entries } = logged();
    const storage = createDraftStorage({ logger });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    storage.save(draft);
    storage.save(draft);
    expect(summary(entries)).toEqual([
      { level: 'error', message: 'Draft could not be saved', context: { reason: 'quota' }, error: 'QuotaExceededError' },
    ]);

    setItem.mockRestore();
    expect(storage.save(draft)).toEqual({ ok: true });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    storage.save(draft);
    expect(entries).toHaveLength(2);
    expect(entries[1]?.context).toEqual({ reason: 'unavailable' });
  });
});

describe('getLocalStorage', () => {
  it('returns localStorage, or null when accessing it throws', () => {
    expect(getLocalStorage()).toBe(window.localStorage);
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(getLocalStorage()).toBeNull();
  });
});

describe('parseDraft', () => {
  const photo = draft.photos[0];
  const spread = draft.spreads[0];

  it.each<[string, unknown]>([
    ['not an object', 'draft'],
    ['null', null],
    ['a bad title', { ...draft, title: 5 }],
    ['a bad format', { ...draft, format: 'a4' }],
    ['an inherited key as format', { ...draft, format: 'toString' }],
    ['a bad cover type', { ...draft, coverType: 'leather' }],
    ['a bad theme', { ...draft, theme: 'neon' }],
    ['photos not an array', { ...draft, photos: {} }],
    ['a photo that is not an object', { ...draft, photos: [7] }],
    ['a photo with an empty id', { ...draft, photos: [{ ...photo, id: '' }] }],
    ['a photo with a bad url', { ...draft, photos: [{ ...photo, url: null }] }],
    ['a photo with a bad name', { ...draft, photos: [{ ...photo, name: 1 }] }],
    ['a photo with bad alt text', { ...draft, photos: [{ ...photo, alt: undefined }] }],
    ['a photo with a bad missing flag', { ...draft, photos: [{ ...photo, missing: 'yes' }] }],
    ['duplicate photo ids', { ...draft, photos: [photo, photo] }],
    ['spreads not an array', { ...draft, spreads: 'x' }],
    ['no spreads', { ...draft, spreads: [] }],
    ['more than 50 spreads', { ...draft, spreads: Array.from({ length: 51 }, (_, i) => createSpread(`s${i}`)) }],
    ['a spread that is not an object', { ...draft, spreads: [[]] }],
    ['a spread with an empty id', { ...draft, spreads: [{ ...spread, id: '' }] }],
    ['a spread with a bad layout', { ...draft, spreads: [{ ...spread, layout: 'grid' }] }],
    ['a spread with a bad caption', { ...draft, spreads: [{ ...spread, caption: null }] }],
    ['slots not an array', { ...draft, spreads: [{ ...spread, slots: 'p1' }] }],
    ['too many slots', { ...draft, spreads: [{ ...spread, slots: Array(7).fill(null) }] }],
    ['a slot that is not a string', { ...draft, spreads: [{ ...spread, slots: [1] }] }],
    ['duplicate spread ids', { ...draft, spreads: [spread, spread] }],
  ])('rejects %s', (_, value) => {
    expect(parseDraft(value)).toBeNull();
  });

  it('clears slots that point at unknown photos and drops unknown fields', () => {
    const parsed = parseDraft({
      ...draft,
      extra: true,
      photos: [{ ...photo, extra: true }],
      spreads: [{ ...spread, slots: ['p1', 'gone', null, 'gone'], extra: true }],
    });
    expect(parsed).toEqual({ ...draft, photos: [photo], spreads: [{ ...spread, slots: ['p1'] }] });
  });

  it('marks blob: photos as missing and keeps them in their slots', () => {
    const blob = { id: 'p1', url: 'blob:http://localhost/abc', name: '1.jpg', alt: 'Dog' };
    const parsed = parseDraft({ ...draft, photos: [blob], spreads: [{ ...spread, slots: ['p1'] }] });
    expect(parsed?.photos).toEqual([{ ...blob, missing: true }]);
    expect(parsed?.spreads[0]?.slots).toEqual(['p1']);
  });

  it('keeps an explicit missing flag and drops a false one', () => {
    const parsed = parseDraft({
      ...draft,
      photos: [
        { ...photo, missing: true },
        { ...draft.photos[1], missing: false },
      ],
    });
    expect(parsed?.photos.map((p) => p.missing)).toEqual([true, undefined]);
    expect(parsed?.photos[1]).not.toHaveProperty('missing');
  });
});
