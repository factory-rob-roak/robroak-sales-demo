import type { Spread } from '../types';
import { cx } from './classNames';
import styles from './SpreadList.module.css';

interface SpreadListItemProps {
  spread: Spread;
  index: number;
  count: number;
  current: boolean;
  thumbnailUrl: string | undefined;
  onSelect: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
}

export function SpreadListItem({
  spread,
  index,
  count,
  current,
  thumbnailUrl,
  onSelect,
  onMove,
  onDelete,
}: SpreadListItemProps) {
  const number = index + 1;
  const first = index * 2 + 1;
  const isFirst = index === 0;
  const isLast = index === count - 1;

  return (
    <li className={cx(styles.item, current && styles.current)}>
      <button
        type="button"
        className={styles.select}
        data-focus-key={`${spread.id}-select`}
        aria-label={`Spread ${number}, pages ${first}–${first + 1}`}
        aria-current={current ? 'true' : undefined}
        onClick={onSelect}
      >
        <span className={styles.thumb}>
          {thumbnailUrl && <img className={styles.thumbImage} src={thumbnailUrl} alt="" />}
        </span>
        <span className={styles.label}>
          Spread {number}
          <span className={styles.pagesLabel}>
            Pages {first}–{first + 1}
          </span>
        </span>
      </button>
      <button
        data-focus-key={`${spread.id}-up`}
        type="button"
        className={styles.icon}
        aria-label={`Move spread ${number} up`}
        aria-disabled={isFirst}
        onClick={() => !isFirst && onMove('up')}
      >
        <span aria-hidden="true">↑</span>
      </button>
      <button
        data-focus-key={`${spread.id}-down`}
        type="button"
        className={styles.icon}
        aria-label={`Move spread ${number} down`}
        aria-disabled={isLast}
        onClick={() => !isLast && onMove('down')}
      >
        <span aria-hidden="true">↓</span>
      </button>
      <button
        type="button"
        className={styles.icon}
        aria-label={`Delete spread ${number}`}
        aria-disabled={count <= 1}
        onClick={() => count > 1 && onDelete()}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}
