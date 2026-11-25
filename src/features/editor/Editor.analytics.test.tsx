import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AnalyticsProvider } from '../../api/analytics/AnalyticsProvider';
import { createMemoryAnalyticsClient } from '../../api/analytics/createMemoryAnalyticsClient';
import { createStubPhotoUploadClient } from '../../api/createStubPhotoUploadClient';
import { PhotoUploadProvider } from '../../api/PhotoUploadProvider';
import type { Project } from '../../types';
import { PHOTO_DRAG_TYPE } from './components/photoDrag';
import { Editor } from './Editor';
import type { DraftStorage } from './storage';
import type { BookDraft, Spread } from './types';

const project: Project = {
  id: 'p1',
  title: 'Lake week',
  format: 'square-8',
  pageCount: 4,
  coverType: 'softcover',
  updatedAt: '2026-11-01T12:00:00Z',
};

const photos: BookDraft['photos'] = [
  { id: 'p1', url: 'https://img.test/beach.jpg', name: 'beach.jpg', alt: 'Beach at sunset' },
  { id: 'p2', url: 'https://img.test/dog.jpg', name: 'dog.jpg', alt: 'Dog in the waves' },
];

const twoSpreads: BookDraft = {
  title: 'Lake week',
  format: 'square-8',
  coverType: 'softcover',
  theme: 'classic',
  spreads: [
    { id: 's1', layout: 'two-up', slots: ['p1'], caption: '' },
    { id: 's2', layout: 'full', slots: [], caption: '' },
  ],
  photos,
};

function spreads(count: number, firstEmpty: number): Spread[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    layout: 'full',
    slots: i < firstEmpty ? ['p1'] : [],
    caption: '',
  }));
}

function renderEditor(draft: BookDraft = twoSpreads) {
  const analytics = createMemoryAnalyticsClient();
  const storage: DraftStorage = { load: () => ({ status: 'loaded', draft }), save: () => ({ ok: true }) };
  let nextId = 0;
  const uploads = createStubPhotoUploadClient({
    latencyMs: 0,
    createId: () => `upload-${(nextId += 1)}`,
    createObjectUrl: (file) => `blob:${file.name}`,
  });
  render(
    <AnalyticsProvider client={analytics}>
      <PhotoUploadProvider client={uploads}>
        <Editor project={project} onClose={() => {}} storage={storage} />
      </PhotoUploadProvider>
    </AnalyticsProvider>,
  );
  return analytics;
}

const jpeg = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('Editor analytics', () => {
  it('sends nothing until the user acts', () => {
    const analytics = renderEditor();
    expect(analytics.events).toEqual([]);
  });

  it('counts only the photos that upload successfully', async () => {
    const analytics = renderEditor();
    const notes = new File(['x'], 'notes.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText('Add photos'), [jpeg('a.jpg'), notes, jpeg('b.jpg')], {
      applyAccept: false,
    });
    await screen.findByRole('heading', { name: 'Photos (4)' });
    expect(analytics.events).toEqual([{ name: 'photo_added', properties: { source: 'upload', count: 2 } }]);
  });

  it('sends nothing when every upload fails', async () => {
    const analytics = renderEditor();
    const notes = new File(['x'], 'notes.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText('Add photos'), notes, { applyAccept: false });
    await screen.findByRole('list', { name: 'Upload problems' });
    expect(analytics.events).toEqual([]);
  });

  it('tracks a photo placed from the tray, but not a repeat placement in the same slot', async () => {
    const user = userEvent.setup();
    const analytics = renderEditor();
    const library = within(screen.getByRole('list', { name: 'Photo library' }));
    await user.click(library.getByRole('button', { name: 'Dog in the waves' }));
    await user.click(screen.getByRole('button', { name: 'Place Dog in the waves in slot 2' }));
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();

    await user.click(library.getByRole('button', { name: 'Dog in the waves, in book' }));
    await user.click(screen.getByRole('button', { name: 'Place Dog in the waves in slot 2' }));
    expect(analytics.events).toEqual([{ name: 'photo_added', properties: { source: 'tray', count: 1 } }]);
  });

  it('tracks a photo dragged onto a slot', () => {
    const analytics = renderEditor();
    const slot = screen.getByRole('button', { name: 'Slot 2: empty' });
    const dataTransfer = { types: [PHOTO_DRAG_TYPE], getData: () => 'p2', dropEffect: 'none' };
    fireEvent.dragOver(slot, { dataTransfer });
    fireEvent.drop(slot, { dataTransfer });
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
    expect(analytics.events).toEqual([{ name: 'photo_added', properties: { source: 'drop', count: 1 } }]);
  });

  it('tracks layout changes with the spread and both layouts', async () => {
    const user = userEvent.setup();
    const analytics = renderEditor();
    await user.click(screen.getByRole('radio', { name: 'Collage' }));
    await user.click(screen.getByRole('button', { name: /^Spread 2, pages 3–4/ }));
    await user.click(screen.getByRole('radio', { name: 'Four grid' }));
    expect(analytics.events).toEqual([
      { name: 'layout_changed', properties: { spreadId: 's1', from: 'two-up', to: 'collage' } },
      { name: 'layout_changed', properties: { spreadId: 's2', from: 'full', to: 'four-grid' } },
    ]);
  });

  it('does not track an order the book cannot fill', async () => {
    const analytics = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Order book' }));
    const summary = within(screen.getByRole('region', { name: 'Order summary' }));
    expect(summary.getByRole('alert')).toHaveTextContent("You can't order yet.");
    expect(analytics.events).toEqual([]);
  });

  it('tracks an order once it is ready, after empty spreads are acknowledged', async () => {
    const user = userEvent.setup();
    const analytics = renderEditor({ ...twoSpreads, coverType: 'hardcover', spreads: spreads(11, 10) });
    await user.click(screen.getByRole('button', { name: 'Order book' }));
    expect(analytics.events).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Order anyway' }));
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent('Ready to order'),
    );
    // 8x8 square, 22 pages, hardcover: $29.99 base + 2 extra pages at $1.00 + $15.00 cover.
    expect(analytics.events).toEqual([
      {
        name: 'order_started',
        properties: { pageCount: 22, format: 'square-8', cover: 'hardcover', totalCents: 4699 },
      },
    ]);
  });

  it('tracks an order with no empty spreads on the first click', async () => {
    const analytics = renderEditor({ ...twoSpreads, spreads: spreads(10, 10) });
    await userEvent.click(screen.getByRole('button', { name: 'Order book' }));
    expect(analytics.events).toEqual([
      {
        name: 'order_started',
        properties: { pageCount: 20, format: 'square-8', cover: 'softcover', totalCents: 2999 },
      },
    ]);
  });
});
