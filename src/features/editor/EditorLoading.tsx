import { useEffect, useRef } from 'react';
import styles from './EditorFallback.module.css';

/** Takes focus so keyboard and screen reader users are not left on the unmounted project card. */
export function EditorLoading() {
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    statusRef.current?.focus();
  }, []);

  return (
    <main className={styles.page} aria-busy="true">
      <p ref={statusRef} role="status" tabIndex={-1} className={styles.message}>
        Loading the editor…
      </p>
    </main>
  );
}
