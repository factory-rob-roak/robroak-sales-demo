import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../types';
import { BookSettings } from './components/BookSettings';
import { EditorToolbar } from './components/EditorToolbar';
import { PageCanvas } from './components/PageCanvas';
import { PhotoTray } from './components/PhotoTray';
import { createProjectDraftStorage } from './components/projectDraftStorage';
import { SpreadList } from './components/SpreadList';
import { handleUndoShortcut } from './components/undoShortcuts';
import { useTrayUploads } from './components/useTrayUploads';
import { PAGES_PER_SPREAD } from './constants';
import styles from './Editor.module.css';
import { visibleSlots } from './editorReducer';
import { OrderSummary } from './order/OrderSummary';
import type { DraftStorage } from './storage';
import { useEditor } from './useEditor';

interface EditorProps {
  project: Project;
  onClose: () => void;
  /** Overrides the per-project local storage, for tests. */
  storage?: DraftStorage;
}

export function Editor({ project, onClose, storage }: EditorProps) {
  const [draftStorage] = useState(() => storage ?? createProjectDraftStorage(project));
  const editor = useEditor({ storage: draftStorage });
  const { draft, dispatch } = editor;
  const uploads = useTrayUploads(dispatch);
  const [currentSpreadId, setCurrentSpreadId] = useState(draft.spreads[0]?.id ?? '');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectNewSpreadAfter, setSelectNewSpreadAfter] = useState<number | null>(null);
  const [returnToSpreadId, setReturnToSpreadId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Opening the editor replaces the whole page, so move focus to its heading.
  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>('h1')?.focus();
  }, []);

  // A newly added spread becomes current once it is in the draft.
  if (selectNewSpreadAfter !== null && draft.spreads.length > selectNewSpreadAfter) {
    setSelectNewSpreadAfter(null);
    setCurrentSpreadId(draft.spreads[draft.spreads.length - 1]?.id ?? currentSpreadId);
  }
  // Any undo that brings back a deleted current spread makes it current again.
  if (returnToSpreadId !== null && draft.spreads.some((spread) => spread.id === returnToSpreadId)) {
    setReturnToSpreadId(null);
    setCurrentSpreadId(returnToSpreadId);
  }
  // Undo or redo can remove the current spread; fall back to the first one.
  const found = draft.spreads.findIndex((spread) => spread.id === currentSpreadId);
  const spreadIndex = Math.max(0, found);
  const currentId = draft.spreads[spreadIndex]?.id ?? '';
  const emptySpreadCount = draft.spreads.filter((spread) =>
    visibleSlots(spread).every((photoId) => photoId === null),
  ).length;

  return (
    <div ref={rootRef} className={styles.editor} onKeyDown={(event) => handleUndoShortcut(event, editor)}>
      <EditorToolbar
        title={draft.title}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        saveStatus={editor.saveStatus}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onClose={onClose}
      />
      <div className={styles.columns}>
        <div className={styles.tray}>
          <PhotoTray
            draft={draft}
            dispatch={dispatch}
            selectedPhotoId={selectedPhotoId}
            onSelectPhoto={setSelectedPhotoId}
            uploads={uploads}
          />
        </div>
        <main className={styles.canvas}>
          <PageCanvas
            draft={draft}
            spreadIndex={spreadIndex}
            dispatch={dispatch}
            selectedPhotoId={selectedPhotoId}
            onPhotoPlaced={() => setSelectedPhotoId(null)}
            onReAddPhoto={uploads.reAddPhoto}
          />
        </main>
        <div className={styles.side}>
          <SpreadList
            draft={draft}
            dispatch={dispatch}
            currentSpreadId={currentId}
            onSelectSpread={(spreadId, replacedSpreadId) => {
              setCurrentSpreadId(spreadId);
              setReturnToSpreadId(replacedSpreadId ?? null);
            }}
            onAddSpread={() => {
              setSelectNewSpreadAfter(draft.spreads.length);
              editor.addSpread();
            }}
            onUndo={editor.undo}
          />
          <OrderSummary
            format={draft.format}
            coverType={draft.coverType}
            pageCount={draft.spreads.length * PAGES_PER_SPREAD}
            emptySpreadCount={emptySpreadCount}
          />
          <BookSettings draft={draft} dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}
