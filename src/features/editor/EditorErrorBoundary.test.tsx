import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStubLogger } from '../../api/createStubLogger';
import type { LogEntry } from '../../api/logger';
import { LoggerProvider } from '../../api/LoggerProvider';
import type { Project } from '../../types';
import { Editor } from './Editor';
import { EditorErrorBoundary } from './EditorErrorBoundary';
import type { DraftStorage } from './storage';
import type { BookDraft } from './types';

const project: Project = {
  id: 'p1',
  title: 'Summer in Maine',
  format: 'landscape-11',
  pageCount: 24,
  coverType: 'hardcover',
  updatedAt: '2026-11-01T12:00:00Z',
};

const saved: BookDraft = {
  title: 'Lake week',
  format: 'square-8',
  coverType: 'softcover',
  theme: 'classic',
  spreads: [{ id: 's1', layout: 'full', slots: [], caption: '' }],
  photos: [],
};

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) throw new Error('Render exploded');
  return <p>Editor content</p>;
}

function renderBoundary(children: ReactNode, onClose = vi.fn()) {
  const entries: LogEntry[] = [];
  const logger = createStubLogger({ onEntry: (entry) => entries.push(entry) });
  render(
    <LoggerProvider logger={logger}>
      <EditorErrorBoundary onClose={onClose}>{children}</EditorErrorBoundary>
    </LoggerProvider>,
  );
  return { entries, onClose };
}

beforeEach(() => {
  shouldThrow = true;
  // React reports caught render errors to the console; keep test output readable.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EditorErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    shouldThrow = false;
    const { entries } = renderBoundary(<Flaky />);
    expect(screen.getByText('Editor content')).toBeInTheDocument();
    expect(entries).toEqual([]);
  });

  it('shows a focused fallback when a child throws and reports the error', () => {
    const { entries } = renderBoundary(<Flaky />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Something went wrong in the editor' });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('main')).toHaveTextContent('reopen your book from its last saved version');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Editor content')).not.toBeInTheDocument();

    expect(entries).toEqual([
      expect.objectContaining({
        level: 'error',
        message: 'Render error caught by boundary',
        context: { boundary: 'editor', componentStack: expect.stringContaining('Flaky') },
        error: expect.objectContaining({ name: 'Error', message: 'Render exploded' }),
      }),
    ]);
  });

  it('mounts the children again with the keyboard when the user tries again', async () => {
    const user = userEvent.setup();
    renderBoundary(<Flaky />);

    shouldThrow = false;
    await user.tab();
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Editor content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Something went wrong in the editor' })).not.toBeInTheDocument();
  });

  it('shows the fallback again and reports again if the retry fails too', async () => {
    const { entries } = renderBoundary(<Flaky />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { name: 'Something went wrong in the editor' })).toBeInTheDocument();
    expect(entries).toHaveLength(2);
  });

  it('goes back to the projects list', async () => {
    const { onClose } = renderBoundary(<Flaky />);
    await userEvent.click(screen.getByRole('button', { name: 'Back to projects' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('reloads the project from storage when the editor recovers', async () => {
    const load = vi.fn<DraftStorage['load']>(() => {
      throw new Error('Storage read crashed');
    });
    renderBoundary(<Editor project={project} onClose={() => {}} storage={{ load, save: () => ({ ok: true }) }} />);
    expect(screen.getByRole('heading', { name: 'Something went wrong in the editor' })).toBeInTheDocument();

    load.mockClear();
    load.mockReturnValue({ status: 'loaded', draft: saved });
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Lake week' })).toBeInTheDocument();
    expect(load).toHaveBeenCalled();
  });
});
