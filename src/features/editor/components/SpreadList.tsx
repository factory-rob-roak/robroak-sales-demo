import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { MAX_SPREADS, PAGES_PER_SPREAD } from '../constants';
import type { EditorAction, Photo, Spread } from '../types';
import styles from './SpreadList.module.css';
import { SpreadListItem } from './SpreadListItem';

interface DeletedSpread {
  spreadId: string;
  number: number;
  spreadsBefore: Spread[];
  spreadsAfter: Spread[] | null;
}

/** Takes spreads and photos rather than the whole draft, so title and settings edits skip the list. */
interface SpreadListProps {
  spreads: Spread[];
  photos: Photo[];
  dispatch: (action: EditorAction) => void;
  currentSpreadId: string;
  onSelectSpread: (spreadId: string) => void;
  onAddSpread: () => void;
  onUndo: () => void;
}

export const SpreadList = memo(function SpreadList({
  spreads,
  photos,
  dispatch,
  currentSpreadId,
  onSelectSpread,
  onAddSpread,
  onUndo,
}: SpreadListProps) {
  const headingId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  // The undo offer only makes sense while the delete is still the latest change to the spreads.
  const [deleted, setDeleted] = useState<DeletedSpread | null>(null);
  // Moving and deleting re-render the list; these say where keyboard focus goes afterwards.
  const pendingFocus = useRef<string | null>(null);
  const photoUrl = new Map(photos.filter((p) => !p.missing).map((p) => [p.id, p.url]));
  const pageCount = spreads.length * PAGES_PER_SPREAD;
  if (deleted && deleted.spreadsAfter === null && spreads !== deleted.spreadsBefore) {
    setDeleted({ ...deleted, spreadsAfter: spreads });
  }

  useEffect(() => {
    const key = pendingFocus.current;
    if (key === null) return;
    pendingFocus.current = null;
    if (key === 'undo') {
      undoRef.current?.focus();
      return;
    }
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-focus-key]') ?? [];
    Array.from(buttons)
      .find((button) => button.dataset.focusKey === key)
      ?.focus();
  });

  const move = useCallback(
    (spreadId: string, direction: 'up' | 'down') => {
      dispatch({ type: 'moveSpread', spreadId, direction });
      pendingFocus.current = `${spreadId}-${direction}`;
    },
    [dispatch],
  );

  // Read at click time so `remove` stays stable when one spread changes; otherwise
  // every item would re-render on each caption keystroke.
  const latest = useRef({ spreads, currentSpreadId });
  useLayoutEffect(() => {
    latest.current = { spreads, currentSpreadId };
  });

  const remove = useCallback(
    (spreadId: string, index: number) => {
      const { spreads: before, currentSpreadId: currentId } = latest.current;
      dispatch({ type: 'deleteSpread', spreadId });
      setDeleted({ spreadId, number: index + 1, spreadsBefore: before, spreadsAfter: null });
      if (spreadId === currentId) {
        const remaining = before.filter((s) => s.id !== spreadId);
        const next = remaining[Math.min(index, remaining.length - 1)];
        if (next) onSelectSpread(next.id);
      }
      pendingFocus.current = 'undo';
    },
    [dispatch, onSelectSpread],
  );

  const undoDelete = (spreadId: string) => {
    onUndo();
    pendingFocus.current = `${spreadId}-select`;
  };

  return (
    <section className={styles.pages} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.heading}>
          Pages
        </h2>
        <p className={styles.count}>
          {spreads.length} {spreads.length === 1 ? 'spread' : 'spreads'} · {pageCount} printed pages
        </p>
      </div>
      <ol ref={listRef} className={styles.list}>
        {spreads.map((spread, index) => (
          <SpreadListItem
            key={spread.id}
            spread={spread}
            index={index}
            count={spreads.length}
            current={spread.id === currentSpreadId}
            thumbnailUrl={photoUrl.get(spread.slots.find((id) => id !== null) ?? '')}
            onSelect={onSelectSpread}
            onMove={move}
            onDelete={remove}
          />
        ))}
      </ol>
      {deleted && deleted.spreadsAfter === spreads && (
        <div role="status" className={styles.notice}>
          Spread {deleted.number} deleted.
          <button
            ref={undoRef}
            type="button"
            className={styles.button}
            onClick={() => undoDelete(deleted.spreadId)}
          >
            Undo
          </button>
        </div>
      )}
      <button
        type="button"
        className={styles.button}
        aria-disabled={spreads.length >= MAX_SPREADS}
        onClick={() => {
          if (spreads.length < MAX_SPREADS) onAddSpread();
        }}
      >
        Add spread
      </button>
    </section>
  );
});
