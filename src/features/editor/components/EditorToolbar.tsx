import type { SaveStatus } from '../types';
import styles from './EditorToolbar.module.css';

const SAVE_MESSAGES: Record<SaveStatus, string> = {
  saved: 'All changes saved on this device',
  pending: 'Saving…',
  error: 'Could not save. Free up browser storage, or keep this tab open.',
};

interface EditorToolbarProps {
  title: string;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
}

export function EditorToolbar({ title, canUndo, canRedo, saveStatus, onUndo, onRedo, onClose }: EditorToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <button type="button" className={styles.button} onClick={onClose}>
        <span aria-hidden="true">←</span> Back to projects
      </button>
      <h1 className={styles.title}>{title.trim() || 'Untitled book'}</h1>
      <div className={styles.history} role="group" aria-label="History">
        <button
          type="button"
          className={styles.button}
          aria-disabled={!canUndo}
          aria-keyshortcuts="Control+Z Meta+Z"
          onClick={() => canUndo && onUndo()}
        >
          Undo
        </button>
        <button
          type="button"
          className={styles.button}
          aria-disabled={!canRedo}
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          onClick={() => canRedo && onRedo()}
        >
          Redo
        </button>
      </div>
      <p role="status" className={styles[saveStatus]}>
        {SAVE_MESSAGES[saveStatus]}
      </p>
    </header>
  );
}
