import { describe, expect, it } from 'vitest';
import { createSpread } from './constants';
import { editorReducer } from './editorReducer';
import {
  COALESCE_WINDOW_MS,
  HISTORY_LIMIT,
  createHistory,
  editorCoalesceKey,
  withHistory,
  type History,
  type HistoryAction,
} from './history';
import type { BookDraft, EditorAction } from './types';

type CounterAction = { type: 'add'; by: number } | { type: 'type'; field: string };

const counter = withHistory<number, CounterAction>((n, a) => (a.type === 'add' ? n + a.by : n + 1), {
  limit: 3,
  coalesceKey: (a) => (a.type === 'type' ? a.field : null),
});

const add = (by: number, at = 0): HistoryAction<CounterAction> => ({ type: 'apply', action: { type: 'add', by }, at });
const type = (field: string, at: number): HistoryAction<CounterAction> => ({
  type: 'apply',
  action: { type: 'type', field },
  at,
});
const run = (h: History<number>, ...actions: HistoryAction<CounterAction>[]) => actions.reduce(counter, h);

describe('withHistory', () => {
  it('undoes and redoes in order', () => {
    const h = run(createHistory(0), add(1), add(2));
    expect(h.present).toBe(3);
    const undone = run(h, { type: 'undo' }, { type: 'undo' });
    expect(undone.present).toBe(0);
    expect(run(undone, { type: 'redo' }).present).toBe(1);
    expect(run(undone, { type: 'redo' }, { type: 'redo' }).present).toBe(3);
  });

  it('ignores undo and redo with nothing to undo or redo', () => {
    const h = createHistory(0);
    expect(run(h, { type: 'undo' })).toBe(h);
    expect(run(h, { type: 'redo' })).toBe(h);
  });

  it('clears redo when a new action is applied', () => {
    const h = run(createHistory(0), add(1), add(2), { type: 'undo' }, add(10));
    expect(h.present).toBe(11);
    expect(h.future).toEqual([]);
    expect(run(h, { type: 'redo' })).toBe(h);
  });

  it('adds no step for actions that do not change state', () => {
    const h = run(createHistory(0), add(1));
    expect(run(h, add(0))).toBe(h);
  });

  it('keeps only the most recent steps', () => {
    const h = run(createHistory(0), add(1), add(1), add(1), add(1), add(1));
    expect(h.past).toEqual([2, 3, 4]);
    expect(run(h, { type: 'undo' }, { type: 'undo' }, { type: 'undo' }, { type: 'undo' }).present).toBe(2);
  });

  it('defaults to a 50-step limit with no coalescing', () => {
    const plain = withHistory<number, number>((n, by) => n + by);
    let h = createHistory(0);
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) h = plain(h, { type: 'apply', action: 1, at: 0 });
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.burst).toBeNull();
  });

  it('coalesces a burst of edits to one field into one step', () => {
    const h = run(createHistory(0), add(5), type('caption', 0), type('caption', 400), type('caption', 1300));
    expect(h.present).toBe(8);
    expect(h.past).toEqual([0, 5]);
    expect(run(h, { type: 'undo' }).present).toBe(5);
  });

  it('starts a new step after a pause, another field, another action, or an undo', () => {
    const pause = run(createHistory(0), type('a', 0), type('a', COALESCE_WINDOW_MS + 1));
    expect(pause.past).toEqual([0, 1]);
    const otherField = run(createHistory(0), type('a', 0), type('b', 10));
    expect(otherField.past).toEqual([0, 1]);
    const between = run(createHistory(0), type('a', 0), add(1, 10), type('a', 20));
    expect(between.past).toEqual([0, 1, 2]);
    const afterUndo = run(createHistory(0), add(1), type('a', 0), { type: 'undo' }, type('a', 10));
    expect(afterUndo.past).toEqual([0, 1]);
    expect(afterUndo.present).toBe(2);
  });
});

describe('editor history', () => {
  const editor = withHistory(editorReducer, { coalesceKey: editorCoalesceKey });
  const apply = (action: EditorAction, at = 0): HistoryAction<EditorAction> => ({ type: 'apply', action, at });
  const draft: BookDraft = {
    title: '',
    format: 'square-8',
    coverType: 'softcover',
    theme: 'classic',
    giftMessage: '',
    spreads: [createSpread('a'), createSpread('b')],
    photos: [],
  };

  it('undoes a whole caption typed in one burst in one step', () => {
    const typed = ['B', 'Be', 'Bea', 'Beach'].reduce(
      (h, caption, i) => editor(h, apply({ type: 'setCaption', spreadId: 'a', caption }, i * 100)),
      createHistory(draft),
    );
    expect(typed.present.spreads[0]?.caption).toBe('Beach');
    expect(editor(typed, { type: 'undo' }).present).toBe(draft);
  });

  it('keys caption, title, and alt edits separately and leaves other actions alone', () => {
    expect(editorCoalesceKey({ type: 'setCaption', spreadId: 'a', caption: '' })).toBe('caption:a');
    expect(editorCoalesceKey({ type: 'setCaption', spreadId: 'b', caption: '' })).toBe('caption:b');
    expect(editorCoalesceKey({ type: 'setTitle', title: '' })).toBe('title');
    expect(editorCoalesceKey({ type: 'setGiftMessage', message: '' })).toBe('giftMessage');
    expect(editorCoalesceKey({ type: 'setPhotoAlt', photoId: 'p', alt: '' })).toBe('alt:p');
    expect(editorCoalesceKey({ type: 'autoFill' })).toBeNull();
  });
});
