import { memo, useCallback, useId, useMemo, useState } from 'react';
import type { BookFormat } from '../../../types';
import { visibleSlots } from '../editorReducer';
import type { EditorAction, LayoutId, Photo, Spread, ThemeId } from '../types';
import { cx } from './classNames';
import { LayoutPicker } from './LayoutPicker';
import styles from './PageCanvas.module.css';
import { PageSlot } from './PageSlot';
import shared from './shared.module.css';
import { THEME_CLASS } from './themeClasses';
import { ZoomControls } from './ZoomControls';

const FORMAT_CLASS: Record<BookFormat, string | undefined> = {
  'square-8': styles.formatSquare,
  'landscape-11': styles.formatLandscape,
  'portrait-8x11': styles.formatPortrait,
};

const LAYOUT_CLASS: Record<LayoutId, string | undefined> = {
  full: styles.layoutFull,
  'two-up': styles.layoutTwoUp,
  'three-grid': styles.layoutThreeGrid,
  'four-grid': styles.layoutFourGrid,
  collage: styles.layoutCollage,
};

/**
 * Takes the parts of the draft it shows rather than the whole draft, so edits elsewhere
 * (title, settings, other spreads) and autosave status changes do not re-render it.
 */
interface PageCanvasProps {
  spread: Spread;
  spreadIndex: number;
  spreadCount: number;
  photos: Photo[];
  theme: ThemeId;
  format: BookFormat;
  dispatch: (action: EditorAction) => void;
  /** Photo chosen in the tray for tap or keyboard placement, if any. */
  selectedPhotoId: string | null;
  onPhotoPlaced: () => void;
  onReAddPhoto: (photoId: string) => void;
}

export const PageCanvas = memo(function PageCanvas({
  spread,
  spreadIndex,
  spreadCount,
  photos,
  theme,
  format,
  dispatch,
  selectedPhotoId,
  onPhotoPlaced,
  onReAddPhoto,
}: PageCanvasProps) {
  const [zoomPercent, setZoomPercent] = useState(100);
  const [announcement, setAnnouncement] = useState('');
  const headingId = useId();
  const hintId = useId();
  const spreadId = spread.id;

  const photoById = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const selectedPhoto = (selectedPhotoId && photoById.get(selectedPhotoId)) || null;

  const place = useCallback(
    (slot: number, photoId: string) => {
      dispatch({ type: 'placePhoto', target: { spreadId, slot }, photoId });
      onPhotoPlaced();
      const photo = photoById.get(photoId);
      if (photo) setAnnouncement(`Placed ${photo.alt || photo.name} in slot ${slot + 1}.`);
    },
    [dispatch, onPhotoPlaced, photoById, spreadId],
  );
  const remove = useCallback(
    (slot: number) => dispatch({ type: 'removePhoto', target: { spreadId, slot } }),
    [dispatch, spreadId],
  );

  return (
    <section className={cx(styles.canvas, THEME_CLASS[theme])} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Spread {spreadIndex + 1} of {spreadCount}
      </h2>
      <LayoutPicker
        layout={spread.layout}
        onChange={(layout) => dispatch({ type: 'setLayout', spreadId, layout })}
      />
      <p id={hintId} className={styles.hint}>
        {selectedPhoto
          ? `Choose a slot for ${selectedPhoto.alt || selectedPhoto.name}.`
          : 'Drag a photo onto a slot, or select a photo in the tray and then choose a slot.'}
      </p>
      <div className={styles.viewport}>
        <div
          className={cx(styles.spread, FORMAT_CLASS[format], LAYOUT_CLASS[spread.layout])}
          style={{ width: `calc(min(100%, 48rem) * ${zoomPercent / 100})` }}
        >
          {visibleSlots(spread).map((photoId, slot) => (
            <PageSlot
              key={slot}
              index={slot}
              photo={(photoId && photoById.get(photoId)) || null}
              selectedPhoto={selectedPhoto}
              hintId={hintId}
              onPlace={place}
              onRemove={remove}
              onReAdd={onReAddPhoto}
            />
          ))}
        </div>
      </div>
      <label className={styles.caption}>
        Caption
        <input
          className={styles.captionInput}
          value={spread.caption}
          placeholder="Add a caption"
          onChange={(event) => dispatch({ type: 'setCaption', spreadId, caption: event.target.value })}
        />
      </label>
      <ZoomControls zoomPercent={zoomPercent} onZoomChange={setZoomPercent} />
      <p role="status" className={shared.visuallyHidden}>
        {announcement}
      </p>
    </section>
  );
});
