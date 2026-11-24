import type { PhotoUploadFailure } from '../usePhotoUpload';
import styles from './UploadStatus.module.css';

interface UploadStatusProps {
  inProgressCount: number;
  errors: readonly PhotoUploadFailure[];
  onDismissError: (id: string) => void;
}

export function UploadStatus({ inProgressCount, errors, onDismissError }: UploadStatusProps) {
  return (
    <>
      <p role="status" className={styles.progress}>
        {inProgressCount > 0 &&
          `Uploading ${inProgressCount} ${inProgressCount === 1 ? 'photo' : 'photos'}…`}
      </p>
      <div role="alert">
        {errors.length > 0 && (
          <ul className={styles.errors} aria-label="Upload problems">
            {errors.map((error) => (
              <li key={error.id} className={styles.error}>
                <span>{error.message}</span>
                <button
                  type="button"
                  className={styles.dismiss}
                  aria-label={`Dismiss: ${error.message}`}
                  onClick={() => onDismissError(error.id)}
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
