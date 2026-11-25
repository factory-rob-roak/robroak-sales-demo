import { useId, useRef, useState, type ChangeEvent } from 'react';
import { GIFT_MESSAGE_MAX_LENGTH } from '../constants';
import { fitGiftMessage, giftMessageLength, hasGiftMessage } from '../giftMessage';
import type { BookDraft, EditorAction } from '../types';
import { cx } from './classNames';
import styles from './GiftMessagePanel.module.css';
import { GiftMessagePreview } from './GiftMessagePreview';
import shared from './shared.module.css';
import { useSettledAnnouncement } from './useSettledAnnouncement';

/** Below this many characters left, the counter turns into a warning. */
const LOW_REMAINING = 20;

interface GiftMessagePanelProps {
  draft: BookDraft;
  dispatch: (action: EditorAction) => void;
}

export function GiftMessagePanel({ draft, dispatch }: GiftMessagePanelProps) {
  const headingId = useId();
  const hintId = useId();
  const countId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState('');
  const { giftMessage } = draft;
  const remaining = GIFT_MESSAGE_MAX_LENGTH - giftMessageLength(giftMessage);
  const countAnnouncement = useSettledAnnouncement(
    remaining === 1 ? '1 character remaining' : `${remaining} characters remaining`,
  );

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const field = event.target;
    const fitted = fitGiftMessage(field.value, field.selectionEnd);
    // Writing the fitted text back before React re-renders keeps the caret where the user was typing.
    if (fitted.message !== field.value) {
      field.value = fitted.message;
      field.setSelectionRange(fitted.caret, fitted.caret);
    }
    setNotice(fitted.cut ? `Only ${GIFT_MESSAGE_MAX_LENGTH} characters fit. The rest was left out.` : '');
    dispatch({ type: 'setGiftMessage', message: fitted.message });
  };

  const remove = () => {
    dispatch({ type: 'removeGiftMessage' });
    setNotice('Gift message removed.');
    fieldRef.current?.focus();
  };

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Gift message
      </h2>
      <p id={hintId} className={styles.hint}>
        Optional. Prints on a free page at the end of your book.
      </p>
      <label className={styles.field}>
        Your message
        <textarea
          ref={fieldRef}
          className={styles.textarea}
          rows={5}
          value={giftMessage}
          aria-describedby={`${hintId} ${countId}`}
          onChange={onChange}
        />
      </label>
      <div className={styles.footer}>
        <p id={countId} className={cx(styles.count, remaining < LOW_REMAINING && styles.countLow)}>
          {giftMessageLength(giftMessage)} of {GIFT_MESSAGE_MAX_LENGTH} characters
        </p>
        {hasGiftMessage(giftMessage) && (
          <button type="button" className={styles.remove} onClick={remove}>
            Remove gift message
          </button>
        )}
      </div>
      <GiftMessagePreview message={giftMessage} theme={draft.theme} format={draft.format} />
      <p role="status" className={shared.visuallyHidden}>
        {notice || countAnnouncement}
      </p>
    </section>
  );
}
