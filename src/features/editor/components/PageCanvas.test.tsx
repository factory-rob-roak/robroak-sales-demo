import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { editorReducer } from '../editorReducer';
import type { BookDraft } from '../types';
import { PageCanvas } from './PageCanvas';
import { PHOTO_DRAG_TYPE } from './photoDrag';

function makeDraft(overrides: Partial<BookDraft> = {}): BookDraft {
  return {
    title: 'Trip',
    format: 'square-8',
    coverType: 'softcover',
    theme: 'classic',
    spreads: [{ id: 's1', layout: 'two-up', slots: ['p1', null, 'p3'], caption: '' }],
    photos: [
      { id: 'p1', url: 'blob:p1', name: 'beach.jpg', alt: 'Beach at sunset' },
      { id: 'p2', url: 'blob:p2', name: 'dog.jpg', alt: 'Dog in the waves' },
      { id: 'p3', url: 'blob:p3', name: 'boat.jpg', alt: 'Sailboat' },
    ],
    ...overrides,
  };
}

function Harness({ draft = makeDraft(), selected = null as string | null, onReAddPhoto = vi.fn() }) {
  const [state, dispatch] = useReducer(editorReducer, draft);
  const [selectedPhotoId, setSelectedPhotoId] = useState(selected);
  const spread = state.spreads[0];
  if (!spread) return null;
  return (
    <PageCanvas
      spread={spread}
      spreadIndex={0}
      spreadCount={state.spreads.length}
      photos={state.photos}
      theme={state.theme}
      format={state.format}
      dispatch={dispatch}
      selectedPhotoId={selectedPhotoId}
      onPhotoPlaced={() => setSelectedPhotoId(null)}
      onReAddPhoto={onReAddPhoto}
    />
  );
}

function dataTransfer(photoId: string) {
  return { types: [PHOTO_DRAG_TYPE], getData: () => photoId, dropEffect: 'none' };
}

describe('PageCanvas', () => {
  it('shows only the slots of the current layout', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Spread 1 of 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slot 1: Beach at sunset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slot 2: empty' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Sailboat' })).not.toBeInTheDocument();
  });

  it('places the selected photo from the keyboard and announces it', async () => {
    render(<Harness selected="p2" />);
    const slot = screen.getByRole('button', { name: 'Place Dog in the waves in slot 2' });
    slot.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
    expect(screen.getByText('Placed Dog in the waves in slot 2.')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Slot 1: Beach at sunset' })).toBeInTheDocument();
  });

  it('accepts a photo dropped from the tray', () => {
    render(<Harness />);
    const slot = screen.getByRole('button', { name: 'Slot 2: empty' });
    fireEvent.dragOver(slot, { dataTransfer: dataTransfer('p2') });
    fireEvent.drop(slot, { dataTransfer: dataTransfer('p2') });
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
  });

  it('removes a photo with a named button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo from slot 1' }));
    expect(screen.getByRole('button', { name: 'Slot 1: empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove photo/ })).not.toBeInTheDocument();
  });

  it('offers to re-add a missing photo', async () => {
    const onReAddPhoto = vi.fn();
    const draft = makeDraft();
    draft.photos = draft.photos.map((p) => (p.id === 'p1' ? { ...p, missing: true } : p));
    render(<Harness draft={draft} onReAddPhoto={onReAddPhoto} />);
    expect(screen.getByRole('button', { name: 'Slot 1: beach.jpg (missing)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Re-add photo beach.jpg' }));
    expect(onReAddPhoto).toHaveBeenCalledWith('p1');
  });

  it('edits the caption through a labeled input', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Caption' }), 'Day one');
    expect(screen.getByRole('textbox', { name: 'Caption' })).toHaveValue('Day one');
  });

  it('keeps hidden photos when switching to a bigger layout and back', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Collage' }));
    expect(screen.getByRole('img', { name: 'Sailboat' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Slot \d/ })).toHaveLength(6);
    await userEvent.click(screen.getByRole('radio', { name: 'Full page' }));
    expect(screen.getAllByRole('button', { name: /^Slot \d/ })).toHaveLength(1);
    await userEvent.click(screen.getByRole('radio', { name: 'Collage' }));
    expect(screen.getByRole('img', { name: 'Sailboat' })).toBeInTheDocument();
  });

  it('changes layout from the keyboard with arrow keys', async () => {
    render(<Harness />);
    screen.getByRole('radio', { name: 'Two up' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Three grid' })).toBeChecked();
    expect(screen.getAllByRole('button', { name: /^Slot \d/ })).toHaveLength(3);
  });

  it('keeps zoom between 50% and 200%', async () => {
    render(<Harness />);
    const zoom = within(screen.getByRole('group', { name: 'Zoom' }));
    const zoomIn = zoom.getByRole('button', { name: 'Zoom in' });
    for (let i = 0; i < 6; i += 1) await userEvent.click(zoomIn);
    expect(zoom.getByText('200%')).toBeInTheDocument();
    expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(zoom.getByRole('button', { name: 'Reset zoom' }));
    expect(zoom.getByText('100%')).toBeInTheDocument();
    const zoomOut = zoom.getByRole('button', { name: 'Zoom out' });
    for (let i = 0; i < 4; i += 1) await userEvent.click(zoomOut);
    expect(zoom.getByText('50%')).toBeInTheDocument();
    expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
  });
});
