import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GIFT_MESSAGE_MAX_LENGTH, createDefaultDraft } from '../constants';
import { editorReducer } from '../editorReducer';
import { GiftMessagePanel } from './GiftMessagePanel';
import { ANNOUNCE_DELAY_MS } from './useSettledAnnouncement';

function Harness({ giftMessage = '' }: { giftMessage?: string }) {
  const [draft, dispatch] = useReducer(editorReducer, undefined, () => ({ ...createDefaultDraft(), giftMessage }));
  return (
    <>
      <GiftMessagePanel draft={draft} dispatch={dispatch} />
      <output aria-label="Saved message">{draft.giftMessage}</output>
    </>
  );
}

const field = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Your message' });
const preview = () => screen.getByRole('figure', { name: 'Preview of the last page' });
const saved = () => screen.getByRole('status', { name: 'Saved message' });
const liveRegion = () => within(screen.getByRole('region', { name: 'Gift message' })).getByRole('status');

afterEach(() => {
  vi.useRealTimers();
});

describe('GiftMessagePanel', () => {
  it('shows a labeled, described textarea, an empty preview, and no remove button', () => {
    render(<Harness />);
    expect(field()).toHaveValue('');
    expect(field()).toHaveAccessibleDescription(
      'Optional. Prints on a free page at the end of your book. 0 of 300 characters',
    );
    expect(preview()).toHaveTextContent('Your message will appear here.');
    expect(screen.queryByRole('button', { name: 'Remove gift message' })).not.toBeInTheDocument();
    expect(liveRegion()).toBeEmptyDOMElement();
  });

  it('previews the message and updates the counter as the user types', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(field(), 'Happy birthday,{Enter}Mum');
    expect(saved()).toHaveTextContent('Happy birthday, Mum');
    expect(within(preview()).getByText(/Happy birthday,\s+Mum/)).toBeInTheDocument();
    expect(screen.getByText('19 of 300 characters')).toBeInTheDocument();
  });

  it('announces the remaining characters politely once typing pauses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    render(<Harness />);
    await user.type(field(), 'Hi');
    expect(liveRegion()).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    });
    expect(liveRegion()).toHaveTextContent('298 characters remaining');
  });

  it('blocks typing past the limit, even in the middle of the message', async () => {
    const user = userEvent.setup();
    const full = 'a'.repeat(GIFT_MESSAGE_MAX_LENGTH - 1);
    render(<Harness giftMessage={full} />);
    await user.type(field(), 'bc');
    expect(saved().textContent).toBe(`${full}b`);
    await user.type(field(), 'X', { initialSelectionStart: 0, initialSelectionEnd: 0 });
    expect(saved().textContent).toBe(`${full}b`);
    expect(screen.getByText('300 of 300 characters')).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent('Only 300 characters fit. The rest was left out.');
  });

  it('keeps the start of pasted text that does not fit and the existing message', async () => {
    const user = userEvent.setup();
    render(<Harness giftMessage="Love, Sam" />);
    await user.click(field());
    field().setSelectionRange(0, 0);
    await user.paste('x'.repeat(GIFT_MESSAGE_MAX_LENGTH));
    expect(saved().textContent).toBe(`${'x'.repeat(GIFT_MESSAGE_MAX_LENGTH - 9)}Love, Sam`);
    expect(liveRegion()).toHaveTextContent('Only 300 characters fit.');
  });

  it('removes the message, announces it, and returns focus to the field', async () => {
    const user = userEvent.setup();
    render(<Harness giftMessage="With love" />);
    await user.click(screen.getByRole('button', { name: 'Remove gift message' }));
    expect(saved()).toBeEmptyDOMElement();
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
    expect(liveRegion()).toHaveTextContent('Gift message removed.');
    expect(screen.queryByRole('button', { name: 'Remove gift message' })).not.toBeInTheDocument();
  });

  it('treats a message of only spaces as no gift page', () => {
    render(<Harness giftMessage="   " />);
    expect(preview()).toHaveTextContent('Your message will appear here.');
    expect(screen.queryByRole('button', { name: 'Remove gift message' })).not.toBeInTheDocument();
  });
});
