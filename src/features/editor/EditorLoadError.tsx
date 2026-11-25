import { useEffect, useRef } from 'react';
import type { Project } from '../../types';
import styles from './EditorFallback.module.css';

interface EditorLoadErrorProps {
  project: Project;
  onClose: () => void;
}

export function EditorLoadError({ project, onClose }: EditorLoadErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className={styles.page}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
        Couldn’t open {project.title}
      </h1>
      <p role="alert" className={styles.message}>
        The editor didn’t load. Check your connection, then reload the page to try again.
      </p>
      <button type="button" className={styles.button} onClick={onClose}>
        <span aria-hidden="true">←</span> Back to projects
      </button>
    </main>
  );
}
