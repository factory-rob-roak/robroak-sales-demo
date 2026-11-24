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
  const zoomTo = (next: number) =>
    onZoomChange(Math.min(MAX_ZOOM_PERCENT, Math.max(MIN_ZOOM_PERCENT, next)));
  const atMin = zoomPercent <= MIN_ZOOM_PERCENT;
  const atMax = zoomPercent >= MAX_ZOOM_PERCENT;

  return (
    <div role="group" aria-label="Zoom" className={styles.zoom}>
      <button
        type="button"
        className={styles.button}
        aria-label="Zoom out"
        aria-disabled={atMin}
        onClick={() => zoomTo(zoomPercent - ZOOM_STEP_PERCENT)}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output className={styles.value} aria-live="polite">
        {zoomPercent}%
      </output>
      <button
        type="button"
        className={styles.button}
        aria-label="Zoom in"
        aria-disabled={atMax}
        onClick={() => zoomTo(zoomPercent + ZOOM_STEP_PERCENT)}
      >
        <span aria-hidden="true">+</span>
      </button>
      <button type="button" className={styles.button} onClick={() => onZoomChange(100)}>
        Reset zoom
      </button>
    </div>
  );
}
