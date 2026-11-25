import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpread } from './constants';
import { STORAGE_KEY, type DraftStorage, type LoadResult, type SaveResult } from './storage';
import type { BookDraft } from './types';
import { AUTOSAVE_DELAY_MS, useEditor, type UseEditorOptions } from './useEditor';

const savedDraft: BookDraft = {
  title: 'Saved book',
  format: 'portrait-8x11',
  coverType: 'layflat',
  theme: 'pastel',
  giftMessage: '',
  spreads: [createSpread('s1'), createSpread('s2')],
  photos: [],
};

function fakeStorage(loaded: LoadResult = { status: 'loaded', draft: savedDraft }) {
  const saves: BookDraft[] = [];
  let result: SaveResult = { ok: true };
  const storage: DraftStorage = {
    load: () => loaded,
    save: vi.fn((draft: BookDraft) => {
      saves.push(draft);
      return result;
    }),
  };
  return { storage, saves, failWith: (r: SaveResult) => (result = r) };
}

function setup(options: UseEditorOptions = {}) {
  const fake = fakeStorage();
  let n = 0;
  const hook = renderHook(() => useEditor({ storage: fake.storage, newId: () => `new-${++n}`, ...options }));
  return { ...fake, ...hook };
}

const setTitle = (title: string) => ({ type: 'setTitle', title }) as const;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('useEditor', () => {
  it('starts from the saved draft, with nothing to undo', () => {
    const { result, saves } = setup();
    expect(result.current.draft).toBe(savedDraft);
    expect(result.current).toMatchObject({ canUndo: false, canRedo: false, saveStatus: 'saved' });
    vi.runAllTimers();
    expect(saves).toEqual([]);
  });

  it.each<LoadResult>([{ status: 'empty' }, { status: 'invalid' }, { status: 'unavailable' }])(
    'falls back to a new draft when storage is $status',
    (loaded) => {
      const { result } = renderHook(() => useEditor({ storage: fakeStorage(loaded).storage, newId: () => 'x' }));
      expect(result.current.draft.title).toBe('My Photo Book');
      expect(result.current.draft.spreads.map((s) => s.id)).toEqual(['x', 'x']);
    },
  );

  it('applies actions with undo and redo', () => {
    const { result } = setup();
    act(() => result.current.dispatch({ type: 'setTheme', theme: 'modern' }));
    expect(result.current.draft.theme).toBe('modern');
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.draft).toBe(savedDraft);
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.redo());
    expect(result.current.draft.theme).toBe('modern');
  });

  it('adds spreads with fresh ids', () => {
    const { result } = setup();
    act(() => result.current.addSpread());
    act(() => result.current.addSpread(0));
    expect(result.current.draft.spreads.map((s) => s.id)).toEqual(['new-2', 's1', 's2', 'new-1']);
  });

  it('coalesces typing into one undo step using the injected clock', () => {
    let time = 0;
    const { result } = setup({ now: () => time });
    for (const title of ['S', 'Su', 'Sun']) {
      act(() => result.current.dispatch(setTitle(title)));
      time += 100;
    }
    act(() => result.current.undo());
    expect(result.current.draft).toBe(savedDraft);
  });

  it('autosaves once after a burst of edits', () => {
    const { result, saves } = setup();
    act(() => result.current.dispatch(setTitle('A')));
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1));
    act(() => result.current.dispatch(setTitle('AB')));
    expect(result.current.saveStatus).toBe('pending');
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1));
    expect(saves).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(saves.map((d) => d.title)).toEqual(['AB']);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('honors a custom autosave delay', () => {
    const { result, saves } = setup({ autosaveDelayMs: 10 });
    act(() => result.current.dispatch(setTitle('A')));
    act(() => vi.advanceTimersByTime(10));
    expect(saves).toHaveLength(1);
  });

  it('does not save when undo returns to the saved draft', () => {
    const { result, saves } = setup();
    act(() => result.current.dispatch(setTitle('A')));
    act(() => result.current.undo());
    expect(result.current.saveStatus).toBe('saved');
    act(() => vi.runAllTimers());
    expect(saves).toEqual([]);
  });

  it('reports a failed save and recovers on the next successful one', () => {
    const { result, saves, failWith } = setup();
    failWith({ ok: false, reason: 'quota' });
    act(() => result.current.dispatch(setTitle('A')));
    act(() => vi.runAllTimers());
    expect(result.current.saveStatus).toBe('error');
    failWith({ ok: true });
    act(() => result.current.dispatch(setTitle('AB')));
    expect(result.current.saveStatus).toBe('error');
    act(() => vi.runAllTimers());
    expect(result.current.saveStatus).toBe('saved');
    expect(saves.map((d) => d.title)).toEqual(['A', 'AB']);
  });

  it('shows saved after a failure once undo returns to the saved draft', () => {
    const { result, failWith } = setup();
    failWith({ ok: false, reason: 'unavailable' });
    act(() => result.current.dispatch(setTitle('A')));
    act(() => vi.runAllTimers());
    act(() => result.current.undo());
    expect(result.current.saveStatus).toBe('saved');
  });

  it('saves right away when the page is hidden', () => {
    const { result, saves } = setup();
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    act(() => result.current.dispatch(setTitle('A')));
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    expect(saves).toEqual([]);
    visibility.mockReturnValue('hidden');
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    expect(saves.map((d) => d.title)).toEqual(['A']);
    act(() => void window.dispatchEvent(new Event('pagehide')));
    expect(saves).toHaveLength(1);
    act(() => result.current.dispatch(setTitle('AB')));
    act(() => void window.dispatchEvent(new Event('pagehide')));
    expect(saves.map((d) => d.title)).toEqual(['A', 'AB']);
    visibility.mockRestore();
  });

  it('flushes unsaved changes on unmount and leaves no timers or listeners', () => {
    const { result, saves, unmount, storage } = setup();
    act(() => result.current.dispatch(setTitle('A')));
    unmount();
    expect(saves.map((d) => d.title)).toEqual(['A']);
    expect(vi.getTimerCount()).toBe(0);
    window.dispatchEvent(new Event('pagehide'));
    expect(storage.save).toHaveBeenCalledTimes(1);
  });

  it('does not save on unmount when nothing changed', () => {
    const { saves, unmount } = setup();
    unmount();
    expect(saves).toEqual([]);
  });

  it('uses localStorage and random ids by default', () => {
    const { result } = renderHook(() => useEditor());
    expect(result.current.draft.spreads[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    act(() => result.current.dispatch(setTitle('Stored')));
    act(() => vi.runAllTimers());
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"title":"Stored"');
    const reloaded = renderHook(() => useEditor());
    expect(reloaded.result.current.draft).toEqual(result.current.draft);
  });

  it('saves once per burst under StrictMode', () => {
    const { storage, saves } = fakeStorage();
    const { result } = renderHook(() => useEditor({ storage }), { wrapper: StrictMode });
    expect(saves).toEqual([]);
    act(() => result.current.dispatch(setTitle('A')));
    act(() => vi.runAllTimers());
    expect(saves.map((d) => d.title)).toEqual(['A']);
  });
});
