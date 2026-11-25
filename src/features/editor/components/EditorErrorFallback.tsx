import { useEffect, useRef } from 'react';
import styles from './EditorErrorFallback.module.css';

interface EditorErrorFallbackProps {
  onRetry: () => void;
  onClose: () => void;
}

export function EditorErrorFallback({ onRetry, onClose }: EditorErrorFallbackProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The element that had focus is gone with the editor, so start from the heading.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className={styles.page}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
        Something went wrong in the editor
      </h1>
      <p className={styles.message}>
        The editor stopped because of an unexpected problem. Try again to reopen your book from its last saved
        version, or go back to your projects.
      </p>
      <div className={styles.actions}>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={onRetry}>
          Try again
        </button>
        <button type="button" className={styles.button} onClick={onClose}>
          Back to projects
        </button>
      </div>
    </main>
  );
}
