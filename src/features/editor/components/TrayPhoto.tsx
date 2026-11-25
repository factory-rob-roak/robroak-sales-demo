import { memo } from 'react';
import type { Photo } from '../types';
import { cx } from './classNames';
import { setPhotoDragData } from './photoDrag';
import styles from './TrayPhoto.module.css';

interface TrayPhotoProps {
  photo: Photo;
  used: boolean;
  selected: boolean;
  /** Called with this photo's id to select it, or null to clear the selection. */
  onSelect: (photoId: string | null) => void;
  onReAdd: (photoId: string) => void;
}

export const TrayPhoto = memo(function TrayPhoto({ photo, used, selected, onSelect, onReAdd }: TrayPhotoProps) {
  if (photo.missing) {
    return (
      <li className={cx(styles.item, styles.missing)}>
        <span className={styles.missingName}>{photo.name} is missing</span>
        <button
          type="button"
          className={styles.reAdd}
          aria-label={`Re-add photo ${photo.name}`}
          onClick={() => onReAdd(photo.id)}
        >
          Re-add photo
        </button>
      </li>
    );
  }

  const description = photo.alt || photo.name;
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={cx(styles.photo, selected && styles.selected)}
        aria-label={used ? `${description}, in book` : description}
        aria-pressed={selected}
        draggable
        onDragStart={(event) => setPhotoDragData(event.dataTransfer, photo.id)}
        onClick={() => onSelect(selected ? null : photo.id)}
      >
        <img className={styles.image} src={photo.url} alt={description} draggable={false} />
        {used && (
          <span className={styles.usedBadge} aria-hidden="true">
            In book
          </span>
        )}
      </button>
    </li>
  );
});
