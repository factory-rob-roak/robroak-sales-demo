import { useId } from 'react';
import type { BookFormat } from '../../../types';
import { hasGiftMessage } from '../giftMessage';
import type { ThemeId } from '../types';
import { cx } from './classNames';
import styles from './GiftMessagePreview.module.css';
import { THEME_CLASS } from './themeClasses';

const FORMAT_CLASS: Record<BookFormat, string | undefined> = {
  'square-8': styles.formatSquare,
  'landscape-11': styles.formatLandscape,
  'portrait-8x11': styles.formatPortrait,
};

interface GiftMessagePreviewProps {
  message: string;
  theme: ThemeId;
  format: BookFormat;
}

/** The gift page as it prints at the end of the book, in the book's theme and page shape. */
export function GiftMessagePreview({ message, theme, format }: GiftMessagePreviewProps) {
  const captionId = useId();
  return (
    <figure className={styles.preview} aria-labelledby={captionId}>
      <div className={cx(styles.page, THEME_CLASS[theme], FORMAT_CLASS[format])}>
        {hasGiftMessage(message) ? (
          <p className={styles.message}>{message}</p>
        ) : (
          <p className={styles.placeholder}>Your message will appear here.</p>
        )}
      </div>
      <figcaption id={captionId} className={styles.caption}>Preview of the last page</figcaption>
    </figure>
  );
}
