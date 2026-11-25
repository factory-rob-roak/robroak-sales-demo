import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { Editor } from './Editor';
import type { DraftStorage } from './storage';
import type { BookDraft } from './types';

const renders = vi.hoisted(() => ({ canvas: 0, slot: 0 }));

vi.mock('./components/PageCanvas', async (importOriginal) => {
  const { countRenders } = await import('../../test/countRenders');
  const actual = await importOriginal<typeof import('./components/PageCanvas')>();
  return { PageCanvas: countRenders(actual.PageCanvas, () => (renders.canvas += 1)) };
});

vi.mock('./components/PageSlot', async (importOriginal) => {
  const { countRenders } = await import('../../test/countRenders');
  const actual = await importOriginal<typeof import('./components/PageSlot')>();
  return { PageSlot: countRenders(actual.PageSlot, () => (renders.slot += 1)) };
});

const project: Project = {
  id: 'p1',
  title: 'Summer in Maine',
  format: 'landscape-11',
  pageCount: 24,
  coverType: 'hardcover',
  updatedAt: '2026-11-01T12:00:00Z',
};

const photos = Array.from({ length: 7 }, (_, i) => ({
  id: `p${i}`,
  url: `https://img.test/${i}.jpg`,
  name: `${i}.jpg`,
  alt: `Photo ${i + 1}`,
}));

const saved: BookDraft = {
  title: 'Lake week',
  format: 'square-8',
  coverType: 'softcover',
  theme: 'classic',
  spreads: [
    { id: 's1', layout: 'collage', slots: photos.slice(0, 6).map((p) => p.id), caption: '' },
    { id: 's2', layout: 'full', slots: [], caption: '' },
  ],
  photos,
};

const storage: DraftStorage = { load: () => ({ status: 'loaded', draft: saved }), save: () => ({ ok: true }) };

function resetCounts() {
  renders.canvas = 0;
  renders.slot = 0;
}

describe('Editor page canvas render counts', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Editor project={project} onClose={() => {}} storage={storage} />);
    resetCounts();
  });

  it('does not re-render the canvas while the title is edited and autosaved', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByRole('textbox', { name: 'Title' }), ' 2');
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('All changes saved on this device')).toBeInTheDocument();
    expect(renders).toEqual({ canvas: 0, slot: 0 });
  });

  it('re-renders the canvas but not its slots while the caption is typed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByRole('textbox', { name: 'Caption' }), 'Day');
    expect(screen.getByRole('textbox', { name: 'Caption' })).toHaveValue('Day');
    expect(renders.canvas).toBe(3);
    expect(renders.slot).toBe(0);
  });

  it('does not re-render the slots when zooming', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(within(screen.getByRole('group', { name: 'Zoom' })).getByText('125%')).toBeInTheDocument();
    expect(renders.slot).toBe(0);
  });

  it('still updates every slot when the selected photo changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const library = within(screen.getByRole('list', { name: 'Photo library' }));
    await user.click(library.getByRole('button', { name: 'Photo 7' }));
    expect(screen.getAllByRole('button', { name: /^Place Photo 7 in slot \d$/ })).toHaveLength(6);
    expect(renders.slot).toBe(6);

    resetCounts();
    await user.click(screen.getByRole('button', { name: 'Place Photo 7 in slot 2' }));
    expect(screen.getByRole('button', { name: 'Slot 2: Photo 7' })).toBeInTheDocument();
    // Placing clears the selection, so every slot's name changes once.
    expect(renders.slot).toBe(6);
  });
});
