import { useI18n } from '../../../i18n/useI18n';
import styles from './ZoomControls.module.css';

export const MIN_ZOOM_PERCENT = 50;
export const MAX_ZOOM_PERCENT = 200;
export const ZOOM_STEP_PERCENT = 25;

interface ZoomControlsProps {
  zoomPercent: number;
  onZoomChange: (zoomPercent: number) => void;
}

/** Uses aria-disabled rather than disabled so focus stays on a button that reaches its limit. */
export function ZoomControls({ zoomPercent, onZoomChange }: ZoomControlsProps) {
  const { t } = useI18n();
  const zoomTo = (next: number) =>
    onZoomChange(Math.min(MAX_ZOOM_PERCENT, Math.max(MIN_ZOOM_PERCENT, next)));
  const atMin = zoomPercent <= MIN_ZOOM_PERCENT;
  const atMax = zoomPercent >= MAX_ZOOM_PERCENT;

  return (
    <div role="group" aria-label={t.zoom.label} className={styles.zoom}>
      <button
        type="button"
        className={styles.button}
        aria-label={t.zoom.zoomOut}
        aria-disabled={atMin}
        onClick={() => zoomTo(zoomPercent - ZOOM_STEP_PERCENT)}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output className={styles.value} aria-live="polite">
        {t.zoom.value(zoomPercent)}
      </output>
      <button
        type="button"
        className={styles.button}
        aria-label={t.zoom.zoomIn}
        aria-disabled={atMax}
        onClick={() => zoomTo(zoomPercent + ZOOM_STEP_PERCENT)}
      >
        <span aria-hidden="true">+</span>
      </button>
      <button type="button" className={styles.button} onClick={() => onZoomChange(100)}>
        {t.zoom.reset}
      </button>
    </div>
  );
}
