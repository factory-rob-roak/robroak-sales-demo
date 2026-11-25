import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import type { Project } from '../../types';
import { createProjectDraftStorage } from './components/projectDraftStorage';
import { Editor } from './Editor';
import type { DraftStorage, LoadResult } from './storage';
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
  spreads: [
    { id: 's1', layout: 'two-up', slots: ['p1'], caption: '' },
    { id: 's2', layout: 'full', slots: [], caption: '' },
  ],
  photos: [
    { id: 'p1', url: 'blob:p1', name: 'beach.jpg', alt: 'Beach at sunset' },
    { id: 'p2', url: 'https://img.test/dog.jpg', name: 'dog.jpg', alt: 'Dog in the waves' },
  ],
};

function memoryStorage(loaded: LoadResult = { status: 'loaded', draft: saved }): DraftStorage {
  return { load: () => loaded, save: () => ({ ok: true }) };
}

function renderEditor(storage = memoryStorage()) {
  return render(<Editor project={project} onClose={() => {}} storage={storage} />);
}

describe('Editor', () => {
  it('lays out the tray, canvas, pages, order summary, and settings, and focuses the title', () => {
    renderEditor();
    expect(screen.getByRole('heading', { level: 1, name: 'Lake week' })).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Photos (2)' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Spread 1 of 2' }));
    expect(screen.getByRole('region', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent('4 pages');
    expect(screen.getByRole('region', { name: 'Book settings' })).toBeInTheDocument();
  });

  it('places a photo with the keyboard, then undoes it with Ctrl+Z', async () => {
    const user = userEvent.setup();
    renderEditor();
    const photos = within(screen.getByRole('list', { name: 'Photo library' }));
    photos.getByRole('button', { name: 'Dog in the waves' }).focus();
    await user.keyboard('{Enter}');
    screen.getByRole('button', { name: 'Slot 2: Drop a photo here' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
    await user.keyboard('{Control>}z{/Control}');
    expect(screen.getByRole('button', { name: 'Slot 2: Drop a photo here' })).toBeInTheDocument();
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
  });

  it('only handles shortcuts inside the editor and not while typing', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo from slot 1' }));
    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    expect(screen.getByRole('button', { name: 'Slot 1: Drop a photo here' })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Caption' }), 'x{Control>}z{/Control}');
    expect(screen.getByRole('button', { name: 'Slot 1: Drop a photo here' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: 'Slot 1: Beach at sunset' })).toBeInTheDocument();
  });

  it('shows a new spread on the canvas and updates the order summary', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Add spread' }));
    expect(screen.getByRole('heading', { name: 'Spread 3 of 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Spread 3, pages 5–6' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent('6 pages');
  });

  it('falls back to the first spread when undo removes the current one', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Add spread' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('heading', { name: 'Spread 1 of 2' })).toBeInTheDocument();
  });

  it('starts a project with no saved draft as a new book named after it', () => {
    renderEditor(createProjectDraftStorage(project, memoryStorage({ status: 'empty' })));
    expect(screen.getByRole('heading', { level: 1, name: 'Summer in Maine' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Size' })).toHaveDisplayValue('11x8.5 Landscape');
    expect(screen.getByRole('combobox', { name: 'Cover' })).toHaveDisplayValue('Hardcover');
    expect(screen.getByRole('heading', { name: 'Spread 1 of 2' })).toBeInTheDocument();
  });
  it('has no axe violations with photos in the tray and on the page', async () => {
    const { container } = renderEditor();
    expect(await axeViolations(container)).toEqual([]);
  });
});
