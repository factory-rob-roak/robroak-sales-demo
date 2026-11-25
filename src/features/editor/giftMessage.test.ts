import { describe, expect, it } from 'vitest';
import { GIFT_MESSAGE_MAX_LENGTH } from './constants';
import { clampGiftMessage, fitGiftMessage, giftMessageLength, hasGiftMessage } from './giftMessage';

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

describe('fitGiftMessage', () => {
  const max = GIFT_MESSAGE_MAX_LENGTH;

  it('leaves text that fits alone', () => {
    expect(fitGiftMessage('Hi', 2)).toEqual({ message: 'Hi', caret: 2, cut: false });
  });

  it('drops a character typed at the limit, wherever the caret is', () => {
    const full = 'a'.repeat(max);
    expect(fitGiftMessage(`${full}b`, max + 1)).toEqual({ message: full, caret: max, cut: true });
    expect(fitGiftMessage(`X${full}`, 1)).toEqual({ message: full, caret: 0, cut: true });
  });

  it('keeps the start of a paste and the text after the caret', () => {
    const pasted = `Hello ${'x'.repeat(max)}world`;
    const fitted = fitGiftMessage(pasted, 6 + max);
    expect(fitted).toEqual({ message: `Hello ${'x'.repeat(max - 11)}world`, caret: max - 5, cut: true });
  });

  it('counts emoji as one character and never splits one', () => {
    const text = `${'🎁'.repeat(max)}🎉`;
    const fitted = fitGiftMessage(text, text.length);
    expect(fitted).toEqual({ message: '🎁'.repeat(max), caret: max * 2, cut: true });
  });

  it('cuts from the end when the caret cannot explain the extra text', () => {
    expect(fitGiftMessage('a'.repeat(max + 2), 1)).toEqual({ message: 'a'.repeat(max), caret: max, cut: true });
  });
});
