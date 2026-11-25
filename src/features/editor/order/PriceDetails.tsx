import { useI18n } from '../../../i18n/useI18n';
import { INCLUDED_PAGES, MIN_PAGES } from '../../../lib/pricing';
import type { CoverType } from '../../../types';
import styles from './OrderSummary.module.css';
import type { OrderQuote } from './orderQuote';

interface PriceDetailsProps {
  quote: OrderQuote;
  coverType: CoverType;
}

export function PriceDetails({ quote, coverType }: PriceDetailsProps) {
  const { t, formatCents } = useI18n();
  if (quote.status === 'too-few-pages') {
    return (
      <p className={styles.meta}>
        {t.order.startsAt(formatCents(quote.minimumCents), MIN_PAGES)}
      </p>
    );
  }
  if (quote.status !== 'priced') {
    return <p className={styles.meta}>{t.order.noPrice}</p>;
  }
  const { baseCents, extraPages, extraPagesCents, coverCents } = quote.breakdown;
  return (
    <>
      <p className={styles.total}>
        <span>{t.order.total}</span>
        <span className={styles.amount}>{formatCents(quote.totalCents)}</span>
      </p>
      <dl className={styles.breakdown}>
        <div className={styles.row}>
          <dt>{t.order.base(INCLUDED_PAGES)}</dt>
          <dd>{formatCents(baseCents)}</dd>
        </div>
        {extraPages > 0 && (
          <div className={styles.row}>
            <dt>{t.order.extraPages(extraPages)}</dt>
            <dd>+{formatCents(extraPagesCents)}</dd>
          </div>
        )}
        {coverCents > 0 && (
          <div className={styles.row}>
            <dt>{t.order.coverUpgrade(t.covers[coverType])}</dt>
            <dd>+{formatCents(coverCents)}</dd>
          </div>
        )}
      </dl>
    </>
  );
}
