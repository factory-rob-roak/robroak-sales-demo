import { GIFT_MESSAGE_MAX_LENGTH } from './constants';

/** Counts Unicode code points, so an emoji counts as one character. */
export function giftMessageLength(message: string): number {
  return Array.from(message).length;
}

/** Cuts a message to the maximum length without splitting an emoji in half. */
export function clampGiftMessage(message: string): string {
  const chars = Array.from(message);
  return chars.length <= GIFT_MESSAGE_MAX_LENGTH ? message : chars.slice(0, GIFT_MESSAGE_MAX_LENGTH).join('');
}

/** A message of only spaces or line breaks prints no gift page. */
export function hasGiftMessage(message: string): boolean {
  return message.trim() !== '';
}

export interface FittedGiftMessage {
  message: string;
  /** Where the caret belongs in `message`, in UTF-16 units like `selectionEnd`. */
  caret: number;
  /** True when some typed or pasted text did not fit. */
  cut: boolean;
}

/**
 * Fits edited text to the limit by dropping the end of what was just typed or
 * pasted (the text just before `caret`), so the existing message is never cut.
 */
export function fitGiftMessage(text: string, caret: number): FittedGiftMessage {
  const overflow = giftMessageLength(text) - GIFT_MESSAGE_MAX_LENGTH;
  if (overflow <= 0) return { message: text, caret, cut: false };
  const before = Array.from(text.slice(0, caret));
  if (overflow > before.length) {
    const message = clampGiftMessage(text);
    return { message, caret: message.length, cut: true };
  }
  const kept = before.slice(0, before.length - overflow).join('');
  return { message: kept + text.slice(caret), caret: kept.length, cut: true };
}
