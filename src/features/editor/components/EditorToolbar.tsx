import { useI18n } from '../../../i18n/useI18n';
import type { SaveStatus } from '../types';
import styles from './EditorToolbar.module.css';

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
  const { t } = useI18n();
  return (
    <header className={styles.toolbar}>
      <button type="button" className={styles.button} onClick={onClose}>
        <span aria-hidden="true">←</span> {t.toolbar.back}
      </button>
      <h1 className={styles.title} tabIndex={-1}>{title.trim() || t.toolbar.untitled}</h1>
      <div className={styles.history} role="group" aria-label={t.toolbar.history}>
        <button
          type="button"
          className={styles.button}
          aria-disabled={!canUndo}
          aria-keyshortcuts="Control+Z Meta+Z"
          onClick={() => canUndo && onUndo()}
        >
          {t.common.undo}
        </button>
        <button
          type="button"
          className={styles.button}
          aria-disabled={!canRedo}
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          onClick={() => canRedo && onRedo()}
        >
          {t.common.redo}
        </button>
      </div>
      <p role="status" className={styles[saveStatus]}>
        {t.toolbar.save[saveStatus]}
      </p>
    </header>
  );
}
