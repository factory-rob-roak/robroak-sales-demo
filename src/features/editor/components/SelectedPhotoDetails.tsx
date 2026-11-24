import type { Photo } from '../types';
import styles from './SelectedPhotoDetails.module.css';

interface SelectedPhotoDetailsProps {
  photo: Photo;
  onAltChange: (alt: string) => void;
  onClear: () => void;
}

export function SelectedPhotoDetails({ photo, onAltChange, onClear }: SelectedPhotoDetailsProps) {
  return (
    <div className={styles.details}>
      <label className={styles.label}>
        Description of {photo.name}
        <input
          className={styles.input}
          value={photo.alt}
          onChange={(event) => onAltChange(event.target.value)}
        />
      </label>
      <button type="button" className={styles.clear} onClick={onClear}>
        Clear selection
      </button>
    </div>
  );
}
