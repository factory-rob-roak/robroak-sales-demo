import { useEffect, useId, useRef, useState } from 'react';
import { MAX_SPREADS, PAGES_PER_SPREAD } from '../constants';
import type { BookDraft, EditorAction, Spread } from '../types';
import styles from './SpreadList.module.css';
import { SpreadListItem } from './SpreadListItem';

interface DeletedSpread {
  spreadId: string;
  number: number;
  wasCurrent: boolean;
  spreadsBefore: Spread[];
  spreadsAfter: Spread[] | null;
}

interface SpreadListProps {
  draft: BookDraft;
  dispatch: (action: EditorAction) => void;
  currentSpreadId: string;
  onSelectSpread: (spreadId: string) => void;
  onAddSpread: () => void;
  onUndo: () => void;
}

export function SpreadList({ draft, dispatch, currentSpreadId, onSelectSpread, onAddSpread, onUndo }: SpreadListProps) {
  const headingId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  // The undo offer only makes sense while the delete is still the latest change to the spreads.
  const [deleted, setDeleted] = useState<DeletedSpread | null>(null);
  // Moving and deleting re-render the list; these say where keyboard focus goes afterwards.
  const pendingFocus = useRef<string | null>(null);
  const { spreads } = draft;
  const photoUrl = new Map(draft.photos.filter((p) => !p.missing).map((p) => [p.id, p.url]));
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

  const move = (spread: Spread, direction: 'up' | 'down') => {
    dispatch({ type: 'moveSpread', spreadId: spread.id, direction });
    pendingFocus.current = `${spread.id}-${direction}`;
  };

  const remove = (spread: Spread, index: number) => {
    dispatch({ type: 'deleteSpread', spreadId: spread.id });
    const wasCurrent = spread.id === currentSpreadId;
    setDeleted({ spreadId: spread.id, number: index + 1, wasCurrent, spreadsBefore: spreads, spreadsAfter: null });
    if (wasCurrent) {
      const remaining = spreads.filter((s) => s.id !== spread.id);
      const next = remaining[Math.min(index, remaining.length - 1)];
      if (next) onSelectSpread(next.id);
    }
    pendingFocus.current = 'undo';
  };

  const undoDelete = ({ spreadId, wasCurrent }: DeletedSpread) => {
    onUndo();
    if (wasCurrent) onSelectSpread(spreadId);
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
            onSelect={() => onSelectSpread(spread.id)}
            onMove={(direction) => move(spread, direction)}
            onDelete={() => remove(spread, index)}
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
            onClick={() => undoDelete(deleted)}
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
}
