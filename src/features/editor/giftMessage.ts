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
