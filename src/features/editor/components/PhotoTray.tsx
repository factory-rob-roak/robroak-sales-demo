import { useId, type KeyboardEvent } from 'react';
import type { BookDraft, EditorAction } from '../types';
import styles from './PhotoTray.module.css';
import shared from './shared.module.css';
import { TrayPhoto } from './TrayPhoto';

interface PhotoTrayProps {
  draft: BookDraft;
  dispatch: (action: EditorAction) => void;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string | null) => void;
  onReAddPhoto: (photoId: string) => void;
}

export function PhotoTray({ draft, dispatch, selectedPhotoId, onSelectPhoto, onReAddPhoto }: PhotoTrayProps) {
  const headingId = useId();
  // Matches autoFill: a photo counts as used while any slot entry holds it, even one hidden by the layout.
  const usedIds = new Set(draft.spreads.flatMap((spread) => spread.slots));
  const selectedPhoto = draft.photos.find((photo) => photo.id === selectedPhotoId) ?? null;
  const unusedCount = draft.photos.filter((photo) => !photo.missing && !usedIds.has(photo.id)).length;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && selectedPhoto) onSelectPhoto(null);
  };

  return (
    <section className={styles.tray} aria-labelledby={headingId} onKeyDown={handleKeyDown}>
      <h2 id={headingId} className={styles.heading}>
        Photos ({draft.photos.length})
      </h2>
      <button
        type="button"
        className={styles.autoFill}
        aria-disabled={unusedCount === 0}
        onClick={() => {
          if (unusedCount > 0) dispatch({ type: 'autoFill' });
        }}
      >
        Auto-fill empty slots
      </button>
      {draft.photos.length === 0 ? (
        <p className={styles.empty}>Add photos to start filling your book.</p>
      ) : (
        <ul className={styles.list} aria-label="Photo library">
          {draft.photos.map((photo) => (
            <TrayPhoto
              key={photo.id}
              photo={photo}
              used={usedIds.has(photo.id)}
              selected={photo.id === selectedPhotoId}
              onToggle={() => onSelectPhoto(photo.id === selectedPhotoId ? null : photo.id)}
              onReAdd={() => onReAddPhoto(photo.id)}
            />
          ))}
        </ul>
      )}
      <p role="status" className={shared.visuallyHidden}>
        {selectedPhoto
          ? `Selected ${selectedPhoto.alt || selectedPhoto.name}. Choose a slot on the page.`
          : ''}
      </p>
    </section>
  );
}
