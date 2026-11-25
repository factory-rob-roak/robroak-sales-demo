import { useI18n } from '../../../i18n/useI18n';
import type { Photo } from '../types';
import { cx } from './classNames';
import { setPhotoDragData } from './photoDrag';
import styles from './TrayPhoto.module.css';

interface TrayPhotoProps {
  photo: Photo;
  used: boolean;
  selected: boolean;
  onToggle: () => void;
  onReAdd: () => void;
}

export function TrayPhoto({ photo, used, selected, onToggle, onReAdd }: TrayPhotoProps) {
  const { t } = useI18n();
  if (photo.missing) {
    return (
      <li className={cx(styles.item, styles.missing)}>
        <span className={styles.missingName}>{t.tray.missing(photo.name)}</span>
        <button
          type="button"
          className={styles.reAdd}
          aria-label={t.photos.reAddLabel(photo.name)}
          onClick={onReAdd}
        >
          {t.photos.reAdd}
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
        aria-label={used ? t.tray.inBookLabel(description) : description}
        aria-pressed={selected}
        draggable
        onDragStart={(event) => setPhotoDragData(event.dataTransfer, photo.id)}
        onClick={onToggle}
      >
        <img className={styles.image} src={photo.url} alt={description} draggable={false} />
        {used && (
          <span className={styles.usedBadge} aria-hidden="true">
            {t.tray.inBook}
          </span>
        )}
      </button>
    </li>
  );
}
