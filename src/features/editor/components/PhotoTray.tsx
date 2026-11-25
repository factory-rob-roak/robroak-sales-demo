import { useId, useRef, type KeyboardEvent } from 'react';
import type { BookDraft, EditorAction } from '../types';
import { AddPhotosButton } from './AddPhotosButton';
import styles from './PhotoTray.module.css';
import { SelectedPhotoDetails } from './SelectedPhotoDetails';
import shared from './shared.module.css';
import { TrayPhoto } from './TrayPhoto';
import { UploadStatus } from './UploadStatus';
import type { TrayUploads } from './useTrayUploads';

interface PhotoTrayProps {
  draft: BookDraft;
  dispatch: (action: EditorAction) => void;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string | null) => void;
  uploads: TrayUploads;
}

export function PhotoTray({ draft, dispatch, selectedPhotoId, onSelectPhoto, uploads }: PhotoTrayProps) {
  const headingId = useId();
  const addPhotosRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  // Matches autoFill: a photo counts as used while any slot entry holds it, even one hidden by the layout.
  const usedIds = new Set(draft.spreads.flatMap((spread) => spread.slots));
  const selectedPhoto = draft.photos.find((photo) => photo.id === selectedPhotoId) ?? null;
  const unusedCount = draft.photos.filter((photo) => !photo.missing && !usedIds.has(photo.id)).length;

  // The details panel unmounts with the selection, so focus goes back to the photo it described.
  const clearSelection = () => {
    if (!selectedPhoto) return;
    const focusWasInDetails = detailsRef.current?.contains(document.activeElement) ?? false;
    onSelectPhoto(null);
    if (!focusWasInDetails) return;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-photo-id]') ?? [];
    Array.from(buttons)
      .find((button) => button.dataset.photoId === selectedPhoto.id)
      ?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') clearSelection();
  };

  return (
    <section className={styles.tray} aria-labelledby={headingId} onKeyDown={handleKeyDown}>
      <h2 id={headingId} className={styles.heading}>
        Photos ({draft.photos.length})
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
      {draft.photos.length === 0 ? (
        <p className={styles.empty}>Add photos to start filling your book.</p>
      ) : (
        <ul ref={listRef} className={styles.list} aria-label="Photo library">
          {draft.photos.map((photo) => (
            <TrayPhoto
              key={photo.id}
              photo={photo}
              used={usedIds.has(photo.id)}
              selected={photo.id === selectedPhotoId}
              onToggle={() => onSelectPhoto(photo.id === selectedPhotoId ? null : photo.id)}
              onReAdd={() => uploads.reAddPhoto(photo.id)}
            />
          ))}
        </ul>
      )}
      <div ref={detailsRef}>
        {selectedPhoto && (
          <SelectedPhotoDetails
            photo={selectedPhoto}
            onAltChange={(alt) => dispatch({ type: 'setPhotoAlt', photoId: selectedPhoto.id, alt })}
            onClear={clearSelection}
          />
        )}
      </div>
      <p role="status" className={shared.visuallyHidden}>
        {selectedPhoto
          ? `Selected ${selectedPhoto.alt || selectedPhoto.name}. Choose a slot on the page.`
          : ''}
      </p>
    </section>
  );
}
