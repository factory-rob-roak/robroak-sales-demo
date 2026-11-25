import { memo, useId, useRef, type KeyboardEvent } from 'react';
import type { EditorAction, Photo, Spread } from '../types';
import { AddPhotosButton } from './AddPhotosButton';
import styles from './PhotoTray.module.css';
import { SelectedPhotoDetails } from './SelectedPhotoDetails';
import shared from './shared.module.css';
import { TrayPhoto } from './TrayPhoto';
import { UploadStatus } from './UploadStatus';
import type { TrayUploads } from './useTrayUploads';

/** Takes photos and spreads rather than the whole draft, so title and settings edits skip the tray. */
interface PhotoTrayProps {
  photos: Photo[];
  spreads: Spread[];
  dispatch: (action: EditorAction) => void;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string | null) => void;
  uploads: TrayUploads;
}

export const PhotoTray = memo(function PhotoTray({
  photos,
  spreads,
  dispatch,
  selectedPhotoId,
  onSelectPhoto,
  uploads,
}: PhotoTrayProps) {
  const headingId = useId();
  const addPhotosRef = useRef<HTMLInputElement>(null);
  // Matches autoFill: a photo counts as used while any slot entry holds it, even one hidden by the layout.
  const usedIds = new Set(spreads.flatMap((spread) => spread.slots));
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? null;
  const unusedCount = photos.filter((photo) => !photo.missing && !usedIds.has(photo.id)).length;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && selectedPhoto) onSelectPhoto(null);
  };

  return (
    <section className={styles.tray} aria-labelledby={headingId} onKeyDown={handleKeyDown}>
      <h2 id={headingId} className={styles.heading}>
        Photos ({photos.length})
      </h2>
      <AddPhotosButton onFiles={uploads.onAddFiles} inputRef={addPhotosRef} />
      <input
        ref={uploads.reAddInput.ref}
        type="file"
        className={shared.visuallyHidden}
        accept="image/*"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Replacement photo"
        onChange={uploads.reAddInput.onChange}
      />
      <UploadStatus
        inProgressCount={uploads.inProgressCount}
        errors={uploads.errors}
        onDismissError={uploads.onDismissError}
        returnFocusRef={addPhotosRef}
      />
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
      {photos.length === 0 ? (
        <p className={styles.empty}>Add photos to start filling your book.</p>
      ) : (
        <ul className={styles.list} aria-label="Photo library">
          {photos.map((photo) => (
            <TrayPhoto
              key={photo.id}
              photo={photo}
              used={usedIds.has(photo.id)}
              selected={photo.id === selectedPhotoId}
              onSelect={onSelectPhoto}
              onReAdd={uploads.reAddPhoto}
            />
          ))}
        </ul>
      )}
      {selectedPhoto && (
        <SelectedPhotoDetails
          photo={selectedPhoto}
          onAltChange={(alt) => dispatch({ type: 'setPhotoAlt', photoId: selectedPhoto.id, alt })}
          onClear={() => onSelectPhoto(null)}
        />
      )}
      <p role="status" className={shared.visuallyHidden}>
        {selectedPhoto
          ? `Selected ${selectedPhoto.alt || selectedPhoto.name}. Choose a slot on the page.`
          : ''}
      </p>
    </section>
  );
});
