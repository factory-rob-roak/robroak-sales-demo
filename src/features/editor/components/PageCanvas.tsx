import { useId, useState } from 'react';
import { useI18n } from '../../../i18n/useI18n';
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
  const { t } = useI18n();
  const [zoomPercent, setZoomPercent] = useState(100);
  const [announcement, setAnnouncement] = useState('');
  const headingId = useId();
  const hintId = useId();
  const spread = draft.spreads[spreadIndex];
  if (!spread) return null;

  const photoById = new Map(draft.photos.map((photo) => [photo.id, photo]));
  const selectedPhoto = (selectedPhotoId && photoById.get(selectedPhotoId)) || null;

  const place = (slot: number, photoId: string) => {
    dispatch({ type: 'placePhoto', target: { spreadId: spread.id, slot }, photoId });
    onPhotoPlaced();
    const photo = photoById.get(photoId);
    if (photo) setAnnouncement(t.canvas.placed(photo.alt || photo.name, slot + 1));
  };

  return (
    <section className={cx(styles.canvas, THEME_CLASS[draft.theme])} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {t.canvas.heading(spreadIndex + 1, draft.spreads.length)}
      </h2>
      <LayoutPicker
        layout={spread.layout}
        onChange={(layout) => dispatch({ type: 'setLayout', spreadId: spread.id, layout })}
      />
      <p id={hintId} className={styles.hint}>
        {selectedPhoto
          ? t.canvas.hintSelected(selectedPhoto.alt || selectedPhoto.name)
          : t.canvas.hint}
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
              onPlace={(id) => place(slot, id)}
              onRemove={() => dispatch({ type: 'removePhoto', target: { spreadId: spread.id, slot } })}
              onReAdd={onReAddPhoto}
            />
          ))}
        </div>
      </div>
      <label className={styles.caption}>
        {t.canvas.caption}
        <input
          className={styles.captionInput}
          value={spread.caption}
          placeholder={t.canvas.captionPlaceholder}
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
