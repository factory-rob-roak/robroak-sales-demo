import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { editorReducer } from '../editorReducer';
import type { BookDraft } from '../types';
import { PageCanvas } from './PageCanvas';
import { PhotoTray } from './PhotoTray';
import { PHOTO_DRAG_TYPE } from './photoDrag';

function makeDraft(overrides: Partial<BookDraft> = {}): BookDraft {
  return {
    title: 'Trip',
    format: 'square-8',
    coverType: 'softcover',
    theme: 'classic',
    giftMessage: '',
    spreads: [{ id: 's1', layout: 'two-up', slots: ['p1'], caption: '' }],
    photos: [
      { id: 'p1', url: 'blob:p1', name: 'beach.jpg', alt: 'Beach at sunset' },
      { id: 'p2', url: 'blob:p2', name: 'dog.jpg', alt: 'Dog in the waves' },
    ],
    ...overrides,
  };
}

function Harness({ draft = makeDraft(), onReAddPhoto = vi.fn() }) {
  const [state, dispatch] = useReducer(editorReducer, draft);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  return (
    <>
      <PhotoTray
        draft={state}
        dispatch={dispatch}
        selectedPhotoId={selectedPhotoId}
        onSelectPhoto={setSelectedPhotoId}
        uploads={{
          onAddFiles: vi.fn(),
          inProgressCount: 0,
          errors: [],
          onDismissError: vi.fn(),
          reAddPhoto: onReAddPhoto,
          reAddInput: { ref: { current: null }, onChange: vi.fn() },
        }}
      />
      <PageCanvas
        draft={state}
        spreadIndex={0}
        dispatch={dispatch}
        selectedPhotoId={selectedPhotoId}
        onPhotoPlaced={() => setSelectedPhotoId(null)}
        onReAddPhoto={onReAddPhoto}
      />
    </>
  );
}

const library = () => within(screen.getByRole('list', { name: 'Photo library' }));

describe('PhotoTray', () => {
  it('lists photos with alt text and marks the ones in the book', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Photos (2)' })).toBeInTheDocument();
    expect(library().getByRole('button', { name: 'Beach at sunset, in book' })).toBeInTheDocument();
    expect(library().getByRole('button', { name: 'Dog in the waves' })).toBeInTheDocument();
    expect(library().getByRole('img', { name: 'Dog in the waves' })).toBeInTheDocument();
  });

  it('places a photo with the keyboard only: select in the tray, then choose a slot', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dog = library().getByRole('button', { name: 'Dog in the waves' });
    dog.focus();
    await user.keyboard('{Enter}');
    expect(dog).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Selected Dog in the waves. Choose a slot on the page.')).toHaveAttribute(
      'role',
      'status',
    );
    screen.getByRole('button', { name: 'Place Dog in the waves in slot 2' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
    expect(library().getByRole('button', { name: 'Dog in the waves, in book' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('clears the selection by pressing the photo again or with Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dog = library().getByRole('button', { name: 'Dog in the waves' });
    await user.click(dog);
    await user.click(dog);
    expect(dog).toHaveAttribute('aria-pressed', 'false');
    await user.click(dog);
    await user.keyboard('{Escape}');
    expect(dog).toHaveAttribute('aria-pressed', 'false');
  });

  it('edits the alt text of the selected photo', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(library().getByRole('button', { name: 'Dog in the waves' }));
    const input = screen.getByRole('textbox', { name: 'Description of dog.jpg' });
    await user.clear(input);
    await user.type(input, 'Max at the beach');
    expect(library().getByRole('img', { name: 'Max at the beach' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('textbox', { name: /Description/ })).not.toBeInTheDocument();
  });

  it('starts a native drag with the photo id', () => {
    render(<Harness />);
    const setData = vi.fn();
    fireEvent.dragStart(library().getByRole('button', { name: 'Dog in the waves' }), {
      dataTransfer: { setData, effectAllowed: 'none' },
    });
    expect(setData).toHaveBeenCalledWith(PHOTO_DRAG_TYPE, 'p2');
  });

  it('auto-fills empty slots with unused photos, then has nothing left to fill', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const autoFill = screen.getByRole('button', { name: 'Auto-fill empty slots' });
    expect(autoFill).toHaveAttribute('aria-disabled', 'false');
    await user.click(autoFill);
    expect(screen.getByRole('button', { name: 'Slot 2: Dog in the waves' })).toBeInTheDocument();
    expect(autoFill).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows missing photos with a re-add button instead of a broken image', async () => {
    const onReAddPhoto = vi.fn();
    const draft = makeDraft();
    draft.photos = draft.photos.map((p) => (p.id === 'p2' ? { ...p, missing: true } : p));
    render(<Harness draft={draft} onReAddPhoto={onReAddPhoto} />);
    expect(library().getByText('dog.jpg is missing')).toBeInTheDocument();
    expect(library().queryByRole('img', { name: 'Dog in the waves' })).not.toBeInTheDocument();
    await userEvent.click(library().getByRole('button', { name: 'Re-add photo dog.jpg' }));
    expect(onReAddPhoto).toHaveBeenCalledWith('p2');
  });

  it('invites the user to add photos when the library is empty', () => {
    render(<Harness draft={makeDraft({ photos: [], spreads: [] })} />);
    expect(screen.getByText('Add photos to start filling your book.')).toBeInTheDocument();
  });
});
