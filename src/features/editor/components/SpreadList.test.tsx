import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { createSpread } from '../constants';
import type { DraftStorage } from '../storage';
import type { BookDraft } from '../types';
import { useEditor } from '../useEditor';
import { SpreadList } from './SpreadList';

const start: BookDraft = {
  title: 'Trip',
  format: 'square-8',
  coverType: 'softcover',
  theme: 'classic',
  spreads: [createSpread('a'), createSpread('b'), createSpread('c')],
  photos: [],
};

function Harness({ draft = start }: { draft?: BookDraft }) {
  const [storage] = useState<DraftStorage>(() => ({
    load: () => ({ status: 'loaded', draft }),
    save: () => ({ ok: true }),
  }));
  let n = 0;
  const editor = useEditor({ storage, newId: () => `new-${(n += 1)}` });
  const [currentId, setCurrentId] = useState('a');
  return (
    <SpreadList
      spreads={editor.draft.spreads}
      photos={editor.draft.photos}
      dispatch={editor.dispatch}
      currentSpreadId={currentId}
      onSelectSpread={setCurrentId}
      onAddSpread={() => editor.addSpread()}
      onUndo={editor.undo}
    />
  );
}

const items = () => within(screen.getByRole('list')).getAllByRole('listitem');
const order = () => items().map((item) => item.textContent?.match(/Spread \d+/)?.[0]);

describe('SpreadList', () => {
  it('lists spreads with their printed pages and the page count', () => {
    render(<Harness />);
    expect(screen.getByText('3 spreads · 6 printed pages')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Spread 1, pages 1–2' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Move spread 1 up' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('selects a spread, then moves it down from the keyboard with focus following it', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Spread 2, pages 3–4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Spread 1, pages 1–2' }));
    screen.getByRole('button', { name: 'Move spread 1 down' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Spread 2, pages 3–4' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Move spread 2 down' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Move spread 3 down' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Move spread 3 down' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Spread 3, pages 5–6' })).toHaveAttribute('aria-current', 'true');
  });

  it('deletes a spread without confirm() and offers undo', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete spread 1' }));
    expect(items()).toHaveLength(2);
    expect(screen.getByText('2 spreads · 4 printed pages')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Spread 1 deleted.');
    expect(screen.getByRole('button', { name: 'Spread 1, pages 1–2' })).toHaveAttribute('aria-current', 'true');
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(items()).toHaveLength(3);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Spread 1, pages 1–2' })).toHaveFocus();
  });

  it('drops the undo offer once something else changes the spreads', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete spread 3' }));
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Move spread 1 down' }));
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(order()).toEqual(['Spread 1', 'Spread 2']);
  });

  it('keeps at least one spread', () => {
    render(<Harness draft={{ ...start, spreads: [createSpread('a')] }} />);
    expect(screen.getByRole('button', { name: 'Delete spread 1' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('adds a spread at the end', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Add spread' }));
    expect(items()).toHaveLength(4);
    expect(screen.getByText('4 spreads · 8 printed pages')).toBeInTheDocument();
  });
});
