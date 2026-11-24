import { formatCents } from '../../../lib/money';
import { INCLUDED_PAGES, MIN_PAGES } from '../../../lib/pricing';
import { COVER_LABELS, type CoverType } from '../../../types';
import styles from './OrderSummary.module.css';
import { pluralize, type OrderQuote } from './orderQuote';

interface PriceDetailsProps {
  quote: OrderQuote;
  coverType: CoverType;
}

export function PriceDetails({ quote, coverType }: PriceDetailsProps) {
  if (quote.status === 'too-few-pages') {
    return (
      <p className={styles.meta}>
        Books start at {formatCents(quote.minimumCents)} for {MIN_PAGES} pages.
      </p>
    );
  }
  if (quote.status !== 'priced') {
    return <p className={styles.meta}>The price appears once the page count can be printed.</p>;
  }
  const { baseCents, extraPages, extraPagesCents, coverCents } = quote.breakdown;
  return (
    <>
      <p className={styles.total}>
        <span>Total</span>
        <span className={styles.amount}>{formatCents(quote.totalCents)}</span>
      </p>
      <dl className={styles.breakdown}>
        <div className={styles.row}>
          <dt>Book with {INCLUDED_PAGES} pages</dt>
          <dd>{formatCents(baseCents)}</dd>
        </div>
        {extraPages > 0 && (
          <div className={styles.row}>
            <dt>{pluralize(extraPages, 'extra page')}</dt>
            <dd>+{formatCents(extraPagesCents)}</dd>
          </div>
        )}
        {coverCents > 0 && (
          <div className={styles.row}>
            <dt>{COVER_LABELS[coverType]} upgrade</dt>
            <dd>+{formatCents(coverCents)}</dd>
          </div>
        )}
      </dl>
    </>
  );
}
