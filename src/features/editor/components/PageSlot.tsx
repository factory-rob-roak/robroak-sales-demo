import { useRef, useState, type DragEvent } from 'react';
import type { Messages } from '../../../i18n/catalogs';
import { useI18n } from '../../../i18n/useI18n';
import type { Photo } from '../types';
import { cx } from './classNames';
import styles from './PageSlot.module.css';
import { isPhotoDrag, readPhotoDragData } from './photoDrag';

interface PageSlotProps {
  index: number;
  photo: Photo | null;
  /** The photo chosen in the tray for tap or keyboard placement. */
  selectedPhoto: Photo | null;
  hintId: string;
  onPlace: (photoId: string) => void;
  onRemove: () => void;
  onReAdd: (photoId: string) => void;
}

function describe(photo: Photo | null, t: Messages['slot']): string {
  if (photo === null) return t.empty;
  if (photo.missing) return t.missing(photo.name);
  return photo.alt || photo.name;
}

export function PageSlot({ index, photo, selectedPhoto, hintId, onPlace, onRemove, onReAdd }: PageSlotProps) {
  const { t } = useI18n();
  const [dragOver, setDragOver] = useState(false);
  const targetRef = useRef<HTMLButtonElement>(null);
  const number = index + 1;
  const label = selectedPhoto
    ? t.slot.place(describe(selectedPhoto, t.slot), number)
    : t.slot.label(number, describe(photo, t.slot));

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isPhotoDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    setDragOver(false);
    const photoId = readPhotoDragData(event.dataTransfer);
    if (photoId === null) return;
    event.preventDefault();
    onPlace(photoId);
  };

  return (
    <div
      className={cx(styles.slot, dragOver && styles.dragOver)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        ref={targetRef}
        type="button"
        className={styles.target}
        aria-label={label}
        aria-describedby={hintId}
        aria-disabled={selectedPhoto === null}
        onClick={() => {
          if (selectedPhoto) onPlace(selectedPhoto.id);
        }}
      >
        {photo && !photo.missing ? (
          <img className={styles.image} src={photo.url} alt={photo.alt} draggable={false} />
        ) : (
          <span className={styles.placeholder}>{photo ? t.slot.photoMissing : t.slot.dropHere}</span>
        )}
      </button>
      {photo?.missing && (
        <button
          type="button"
          className={styles.reAdd}
          aria-label={t.photos.reAddLabel(photo.name)}
          onClick={() => onReAdd(photo.id)}
        >
          {t.photos.reAdd}
        </button>
      )}
      {photo && (
        <button
          type="button"
          className={styles.remove}
          aria-label={t.slot.remove(number)}
          onClick={() => {
            onRemove();
            // The remove button unmounts with the photo, so keep keyboard focus on the emptied slot.
            targetRef.current?.focus();
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
