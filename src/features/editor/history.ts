import type { EditorAction } from './types';

export const HISTORY_LIMIT = 50;

/** Edits with the same coalesce key closer together than this become one undo step. */
export const COALESCE_WINDOW_MS = 1000;

export interface History<S> {
  past: S[];
  present: S;
  future: S[];
  /** The coalesce key and time of the last applied edit, while a burst can still be extended. */
  burst: { key: string; at: number } | null;
}

export type HistoryAction<A> =
  | { type: 'apply'; action: A; at: number }
  | { type: 'undo' }
  | { type: 'redo' };

export interface HistoryOptions<A> {
  limit?: number;
  coalesceWindowMs?: number;
  /** Returns a key for actions that merge into one undo step when repeated quickly, or null. */
  coalesceKey?: (action: A) => string | null;
}

export function createHistory<S>(present: S): History<S> {
  return { past: [], present, future: [], burst: null };
}

/** Typing in one caption, the title, or one photo's alt text coalesces into one undo step. */
export function editorCoalesceKey(action: EditorAction): string | null {
  switch (action.type) {
    case 'setCaption':
      return `caption:${action.spreadId}`;
    case 'setTitle':
      return 'title';
    case 'setPhotoAlt':
      return `alt:${action.photoId}`;
    default:
      return null;
  }
}

/** Wraps a reducer with bounded undo/redo. Actions that return the same state add no step. */
export function withHistory<S, A>(
  reducer: (state: S, action: A) => S,
  { limit = HISTORY_LIMIT, coalesceWindowMs = COALESCE_WINDOW_MS, coalesceKey = () => null }: HistoryOptions<A> = {},
): (history: History<S>, action: HistoryAction<A>) => History<S> {
  return (history, historyAction) => {
    const { past, present, future } = history;
    switch (historyAction.type) {
      case 'undo': {
        const previous = past[past.length - 1];
        if (previous === undefined) return history;
        return { past: past.slice(0, -1), present: previous, future: [present, ...future], burst: null };
      }
      case 'redo': {
        const [next, ...rest] = future;
        if (next === undefined) return history;
        return { past: [...past, present], present: next, future: rest, burst: null };
      }
      case 'apply': {
        const { action, at } = historyAction;
        const next = reducer(present, action);
        if (next === present) return history;
        const key = coalesceKey(action);
        const burst = key === null ? null : { key, at };
        const continuesBurst =
          key !== null &&
          history.burst !== null &&
          history.burst.key === key &&
          at - history.burst.at <= coalesceWindowMs;
        if (continuesBurst) return { past, present: next, future: [], burst };
        return { past: [...past, present].slice(-limit), present: next, future: [], burst };
      }
    }
  };
}
