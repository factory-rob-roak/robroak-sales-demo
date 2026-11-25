import { describe, expect, it } from 'vitest';
import { GIFT_MESSAGE_MAX_LENGTH } from './constants';
import { clampGiftMessage, giftMessageLength, hasGiftMessage } from './giftMessage';

describe('giftMessageLength', () => {
  it('counts an emoji as one character', () => {
    expect(giftMessageLength('')).toBe(0);
    expect(giftMessageLength('Love you')).toBe(8);
    expect(giftMessageLength('Hi 🎁')).toBe(4);
  });
});

describe('clampGiftMessage', () => {
  it('keeps a message at or under the limit unchanged', () => {
    const atLimit = 'a'.repeat(GIFT_MESSAGE_MAX_LENGTH);
    expect(clampGiftMessage(atLimit)).toBe(atLimit);
    expect(clampGiftMessage('Happy birthday')).toBe('Happy birthday');
  });

  it('cuts a longer message to the limit', () => {
    expect(clampGiftMessage('a'.repeat(GIFT_MESSAGE_MAX_LENGTH + 50))).toBe('a'.repeat(GIFT_MESSAGE_MAX_LENGTH));
  });

  it('never splits an emoji', () => {
    const clamped = clampGiftMessage('🎁'.repeat(GIFT_MESSAGE_MAX_LENGTH + 1));
    expect(clamped).toBe('🎁'.repeat(GIFT_MESSAGE_MAX_LENGTH));
    expect(giftMessageLength(clamped)).toBe(GIFT_MESSAGE_MAX_LENGTH);
  });
});

describe('hasGiftMessage', () => {
  it('is false for an empty or blank message', () => {
    expect(hasGiftMessage('')).toBe(false);
    expect(hasGiftMessage(' \n\t')).toBe(false);
    expect(hasGiftMessage(' Hi ')).toBe(true);
  });
});
