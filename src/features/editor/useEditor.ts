import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createDefaultDraft, createId, type IdGenerator } from './constants';
import { editorReducer } from './editorReducer';
import { createHistory, editorCoalesceKey, withHistory } from './history';
import { createDraftStorage, type DraftStorage } from './storage';
import type { BookDraft, EditorAction, EditorController, SaveStatus } from './types';

export const AUTOSAVE_DELAY_MS = 800;

export interface UseEditorOptions {
  storage?: DraftStorage;
  newId?: IdGenerator;
  now?: () => number;
  autosaveDelayMs?: number;
}

const historyReducer = withHistory(editorReducer, { coalesceKey: editorCoalesceKey });

/**
 * Editor state with undo/redo and debounced autosave. Options are read once on
 * mount. Unsaved changes are also written when the page is hidden or the
 * editor unmounts, so closing a tab right after an edit does not lose it.
 */
export function useEditor(options: UseEditorOptions = {}): EditorController {
  const [config] = useState(() => ({
    storage: options.storage ?? createDraftStorage(),
    newId: options.newId ?? createId,
    now: options.now ?? Date.now,
    delay: options.autosaveDelayMs ?? AUTOSAVE_DELAY_MS,
  }));
  const [history, dispatchHistory] = useReducer(historyReducer, config, ({ storage, newId }) => {
    const loaded = storage.load();
    return createHistory(loaded.status === 'loaded' ? loaded.draft : createDefaultDraft(newId));
  });
  const draft = history.present;
  const [savedDraft, setSavedDraft] = useState<BookDraft>(draft);
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef({ draft, savedDraft });

  useEffect(() => {
    latest.current = { draft, savedDraft };
  }, [draft, savedDraft]);

  const save = useCallback(
    (toSave: BookDraft) => {
      const result = config.storage.save(toSave);
      setSaveFailed(!result.ok);
      if (result.ok) {
        latest.current.savedDraft = toSave;
        setSavedDraft(toSave);
      }
    },
    [config],
  );

  useEffect(() => {
    if (draft === savedDraft) return;
    const timer = setTimeout(() => save(draft), config.delay);
    return () => clearTimeout(timer);
  }, [draft, savedDraft, save, config]);

  useEffect(() => {
    const flush = () => {
      if (latest.current.draft !== latest.current.savedDraft) save(latest.current.draft);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flush();
    };
  }, [save]);

  const dispatch = useCallback(
    (action: EditorAction) => dispatchHistory({ type: 'apply', action, at: config.now() }),
    [config],
  );
  const addSpread = useCallback(
    (index?: number) => dispatch({ type: 'addSpread', id: config.newId(), index }),
    [dispatch, config],
  );
  const undo = useCallback(() => dispatchHistory({ type: 'undo' }), []);
  const redo = useCallback(() => dispatchHistory({ type: 'redo' }), []);

  let saveStatus: SaveStatus = 'saved';
  if (draft !== savedDraft) saveStatus = saveFailed ? 'error' : 'pending';

  return {
    draft,
    dispatch,
    addSpread,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    saveStatus,
  };
}
