import { useId, useState } from 'react';
import type { PhotoAddedSource } from '../../../api/analytics/analyticsEvents';
import { useTrackEvent } from '../../../api/analytics/AnalyticsProvider';
import type { BookFormat } from '../../../types';
import { visibleSlots } from '../editorReducer';
import type { BookDraft, EditorAction, LayoutId } from '../types';
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

interface PageCanvasProps {
  draft: BookDraft;
  spreadIndex: number;
  dispatch: (action: EditorAction) => void;
  /** Photo chosen in the tray for tap or keyboard placement, if any. */
  selectedPhotoId: string | null;
  onPhotoPlaced: () => void;
  onReAddPhoto: (photoId: string) => void;
}

export function PageCanvas({
  draft,
  spreadIndex,
  dispatch,
  selectedPhotoId,
  onPhotoPlaced,
  onReAddPhoto,
}: PageCanvasProps) {
  const [zoomPercent, setZoomPercent] = useState(100);
  const [announcement, setAnnouncement] = useState('');
  const track = useTrackEvent();
  const headingId = useId();
  const hintId = useId();
  const spread = draft.spreads[spreadIndex];
  if (!spread) return null;

  const photoById = new Map(draft.photos.map((photo) => [photo.id, photo]));
  const selectedPhoto = (selectedPhotoId && photoById.get(selectedPhotoId)) || null;

  const place = (slot: number, photoId: string, source: PhotoAddedSource) => {
    const alreadyThere = visibleSlots(spread)[slot] === photoId;
    dispatch({ type: 'placePhoto', target: { spreadId: spread.id, slot }, photoId });
    onPhotoPlaced();
    const photo = photoById.get(photoId);
    if (!photo) return;
    setAnnouncement(`Placed ${photo.alt || photo.name} in slot ${slot + 1}.`);
    if (!alreadyThere) track({ name: 'photo_added', properties: { source, count: 1 } });
  };

  const changeLayout = (layout: LayoutId) => {
    dispatch({ type: 'setLayout', spreadId: spread.id, layout });
    if (layout !== spread.layout) {
      track({ name: 'layout_changed', properties: { spreadId: spread.id, from: spread.layout, to: layout } });
    }
  };

  return (
    <section className={cx(styles.canvas, THEME_CLASS[draft.theme])} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Spread {spreadIndex + 1} of {draft.spreads.length}
      </h2>
      <LayoutPicker layout={spread.layout} onChange={changeLayout} />
      <p id={hintId} className={styles.hint}>
        {selectedPhoto
          ? `Choose a slot for ${selectedPhoto.alt || selectedPhoto.name}.`
          : 'Drag a photo onto a slot, or select a photo in the tray and then choose a slot.'}
      </p>
      <div className={styles.viewport}>
        <div
          className={cx(styles.spread, FORMAT_CLASS[draft.format], LAYOUT_CLASS[spread.layout])}
          style={{ width: `calc(min(100%, 48rem) * ${zoomPercent / 100})` }}
        >
          {visibleSlots(spread).map((photoId, slot) => (
            <PageSlot
              key={slot}
              index={slot}
              photo={(photoId && photoById.get(photoId)) || null}
              selectedPhoto={selectedPhoto}
              hintId={hintId}
              onPlace={(id, source) => place(slot, id, source)}
              onRemove={() => dispatch({ type: 'removePhoto', target: { spreadId: spread.id, slot } })}
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
          onChange={(event) =>
            dispatch({ type: 'setCaption', spreadId: spread.id, caption: event.target.value })
          }
        />
      </label>
      <ZoomControls zoomPercent={zoomPercent} onZoomChange={setZoomPercent} />
      <p role="status" className={shared.visuallyHidden}>
        {announcement}
      </p>
    </section>
  );
}
