import { useId, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/useI18n';
import type { BookFormat, CoverType } from '../../../types';
import styles from './OrderSummary.module.css';
import { PriceDetails } from './PriceDetails';
import { describeOrderIssue, quoteBook } from './orderQuote';
import { useOrderFlow } from './useOrderFlow';

export interface OrderSummaryProps {
  format: BookFormat;
  coverType: CoverType;
  /** Printed pages: spreads × 2. */
  pageCount: number;
  emptySpreadCount: number;
}

export function OrderSummary({ format, coverType, pageCount, emptySpreadCount }: OrderSummaryProps) {
  const { t, formatCents } = useI18n();
  const quote = quoteBook({ format, coverType, pageCount });
  const issue = describeOrderIssue(quote, t.order);
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
  const bookDescription = t.order.book(pageCount, t.formats[format], t.covers[coverType]);

  return (
    <section className={styles.summary} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.heading}>
          {t.order.heading}
        </h2>
        <button
          type="button"
          className={styles.link}
          aria-expanded={priceVisible}
          aria-controls={priceId}
          onClick={() => setPriceVisible((visible) => !visible)}
        >
          {priceVisible ? t.order.hidePrice : t.order.showPrice}
        </button>
      </div>
      <p className={styles.meta}>{bookDescription}</p>
      <div id={priceId} role="group" aria-label={t.order.priceDetails} hidden={!priceVisible}>
        <PriceDetails quote={quote} coverType={coverType} />
      </div>
      {issue &&
        (flow.step === 'blocked' ? (
          <p key="alert" id={issueId} role="alert" className={styles.alert}>
            {t.order.cantOrder(issue)}
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
        {t.order.orderBook}
      </button>
      {flow.step === 'confirm-empty' && (
        <div role="alert" className={styles.warning}>
          <p>{t.order.emptySpreads(emptySpreadCount)}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={closeWarning(flow.acknowledgeEmpty)}>
              {t.order.orderAnyway}
            </button>
            <button type="button" className={styles.secondary} onClick={closeWarning(flow.cancel)}>
              {t.order.keepEditing}
            </button>
          </div>
        </div>
      )}
      <p role="status" className={styles.status}>
        {flow.step === 'ready' && quote.status === 'priced'
          ? t.order.ready(bookDescription, formatCents(quote.totalCents))
          : null}
      </p>
    </section>
  );
}
