import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SaveStatus } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { handleUndoShortcut } from './undoShortcuts';

function Harness({ undo = vi.fn(), redo = vi.fn() }) {
  return (
    <div onKeyDown={(event) => handleUndoShortcut(event, { undo, redo })}>
      <button type="button">Inside</button>
      <label>
        Caption
        <input />
      </label>
      <label>
        Theme
        <input type="radio" />
      </label>
    </div>
  );
}

function renderToolbar(props: { canUndo?: boolean; canRedo?: boolean; saveStatus?: SaveStatus; title?: string } = {}) {
  const handlers = { onUndo: vi.fn(), onRedo: vi.fn(), onClose: vi.fn() };
  render(
    <EditorToolbar title="Summer" canUndo canRedo saveStatus="saved" {...props} {...handlers} />,
  );
  return handlers;
}

describe('handleUndoShortcut', () => {
  it('undoes with Ctrl+Z or Cmd+Z and redoes with Shift+Ctrl/Cmd+Z or Ctrl+Y', async () => {
    const undo = vi.fn();
    const redo = vi.fn();
    render(<Harness undo={undo} redo={redo} />);
    screen.getByRole('button', { name: 'Inside' }).focus();
    await userEvent.keyboard('{Control>}z{/Control}');
    await userEvent.keyboard('{Meta>}z{/Meta}');
    expect(undo).toHaveBeenCalledTimes(2);
    await userEvent.keyboard('{Control>}{Shift>}Z{/Shift}{/Control}');
    await userEvent.keyboard('{Meta>}{Shift>}z{/Shift}{/Meta}');
    await userEvent.keyboard('{Control>}y{/Control}');
    expect(redo).toHaveBeenCalledTimes(3);
  });

  it('leaves typing alone but works on radios', async () => {
    const undo = vi.fn();
    render(<Harness undo={undo} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Caption' }), 'hi{Control>}z{/Control}');
    expect(undo).not.toHaveBeenCalled();
    screen.getByRole('radio', { name: 'Theme' }).focus();
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('ignores keys pressed outside the editor and plain Z', () => {
    const undo = vi.fn();
    render(<Harness undo={undo} />);
    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Inside' }), { key: 'z' });
    expect(undo).not.toHaveBeenCalled();
  });
});

describe('EditorToolbar', () => {
  it('shows the book title and runs undo, redo, and close', async () => {
    const { onUndo, onRedo, onClose } = renderToolbar();
    expect(screen.getByRole('heading', { level: 1, name: 'Summer' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await userEvent.click(screen.getByRole('button', { name: /Back to projects/ }));
    expect([onUndo, onRedo, onClose].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it('keeps unavailable history buttons focusable but inert', async () => {
    const { onUndo } = renderToolbar({ canUndo: false, title: '  ' });
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(undo);
    expect(onUndo).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Untitled book' })).toBeInTheDocument();
  });

  it.each([
    ['saved', 'All changes saved on this device'],
    ['pending', 'Saving…'],
    ['error', 'Could not save. Free up browser storage, or keep this tab open.'],
  ] as const)('announces the %s save status', (saveStatus, message) => {
    renderToolbar({ saveStatus });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });
});
