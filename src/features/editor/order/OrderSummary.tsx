import { useId, useRef, useState } from 'react';
import { formatCents } from '../../../lib/money';
import { COVER_LABELS, FORMAT_LABELS, type BookFormat, type CoverType } from '../../../types';
import styles from './OrderSummary.module.css';
import { PriceDetails } from './PriceDetails';
import { describeOrderIssue, pluralize, quoteBook } from './orderQuote';
import { useOrderFlow } from './useOrderFlow';

export interface OrderSummaryProps {
  format: BookFormat;
  coverType: CoverType;
  /** Printed pages: spreads × 2. */
  pageCount: number;
  emptySpreadCount: number;
}

export function OrderSummary({ format, coverType, pageCount, emptySpreadCount }: OrderSummaryProps) {
  const quote = quoteBook({ format, coverType, pageCount });
  const issue = describeOrderIssue(quote);
  const flow = useOrderFlow({
    format,
    coverType,
    pageCount,
    emptySpreadCount,
    canOrder: quote.status === 'priced',
  });
  const [priceVisible, setPriceVisible] = useState(true);
  const headingId = useId();
  const priceId = useId();
  const issueId = useId();
  const orderButtonRef = useRef<HTMLButtonElement>(null);
  // The warning's buttons unmount on click, so keep keyboard focus in the summary.
  const closeWarning = (next: () => void) => () => {
    next();
    orderButtonRef.current?.focus();
  };
  const bookDescription = `${pluralize(pageCount, 'page')} · ${FORMAT_LABELS[format]} · ${COVER_LABELS[coverType]}`;

  return (
    <section className={styles.summary} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.heading}>
          Order summary
        </h2>
        <button
          type="button"
          className={styles.link}
          aria-expanded={priceVisible}
          aria-controls={priceId}
          onClick={() => setPriceVisible((visible) => !visible)}
        >
          {priceVisible ? 'Hide price' : 'Show price'}
        </button>
      </div>
      <p className={styles.meta}>{bookDescription}</p>
      <div id={priceId} role="group" aria-label="Price details" hidden={!priceVisible}>
        <PriceDetails quote={quote} coverType={coverType} />
      </div>
      {issue &&
        (flow.step === 'blocked' ? (
          <p key="alert" id={issueId} role="alert" className={styles.alert}>
            You can't order yet. {issue}
          </p>
        ) : (
          <p key="issue" id={issueId} className={styles.issue}>
            {issue}
          </p>
        ))}
      <button
        ref={orderButtonRef}
        type="button"
        className={styles.order}
        aria-describedby={issue ? issueId : undefined}
        onClick={flow.order}
      >
        Order book
      </button>
      {flow.step === 'confirm-empty' && (
        <div role="alert" className={styles.warning}>
          <p>
            {pluralize(emptySpreadCount, 'spread')} {emptySpreadCount === 1 ? 'has' : 'have'} no
            photos and will print blank.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={closeWarning(flow.acknowledgeEmpty)}>
              Order anyway
            </button>
            <button type="button" className={styles.secondary} onClick={closeWarning(flow.cancel)}>
              Keep editing
            </button>
          </div>
        </div>
      )}
      <p role="status" className={styles.status}>
        {flow.step === 'ready' && quote.status === 'priced'
          ? `Ready to order: ${bookDescription} · ${formatCents(quote.totalCents)}`
          : null}
      </p>
    </section>
  );
}
