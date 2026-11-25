import { useRef, type RefObject } from 'react';
import type { PhotoUploadFailure } from '../usePhotoUpload';
import styles from './UploadStatus.module.css';

interface UploadStatusProps {
  inProgressCount: number;
  errors: readonly PhotoUploadFailure[];
  onDismissError: (id: string) => void;
  /** Receives keyboard focus when the last error is dismissed. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

export function UploadStatus({ inProgressCount, errors, onDismissError, returnFocusRef }: UploadStatusProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // The dismiss button unmounts with its error, so move focus to a neighbour before it disappears.
  const dismiss = (id: string, index: number) => {
    const buttons = listRef.current?.querySelectorAll('button') ?? [];
    const next = buttons[index + 1] ?? buttons[index - 1];
    onDismissError(id);
    (next ?? returnFocusRef.current)?.focus();
  };

  return (
    <>
      <p role="status" className={styles.progress}>
        {inProgressCount > 0 &&
          `Uploading ${inProgressCount} ${inProgressCount === 1 ? 'photo' : 'photos'}…`}
      </p>
      <div role="alert">
        {errors.length > 0 && (
          <ul ref={listRef} className={styles.errors} aria-label="Upload problems">
            {errors.map((error, index) => (
              <li key={error.id} className={styles.error}>
                <span>{error.message}</span>
                <button
                  type="button"
                  className={styles.dismiss}
                  aria-label={`Dismiss: ${error.message}`}
                  onClick={() => dismiss(error.id, index)}
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
