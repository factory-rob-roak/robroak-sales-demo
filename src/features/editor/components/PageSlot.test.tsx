import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Photo } from '../types';
import { PageSlot } from './PageSlot';
import { PHOTO_DRAG_TYPE } from './photoDrag';

const beach: Photo = { id: 'p1', url: 'blob:p1', name: 'beach.jpg', alt: 'Beach at sunset' };
const dog: Photo = { id: 'p2', url: 'blob:p2', name: 'dog.jpg', alt: 'Dog in the waves' };

function renderSlot(props: Partial<Parameters<typeof PageSlot>[0]> = {}) {
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onReAdd: vi.fn() };
  render(<PageSlot index={1} photo={null} selectedPhoto={null} hintId="hint" {...handlers} {...props} />);
  return handlers;
}

describe('PageSlot', () => {
  it('names an empty slot and shows its photo with alt text when filled', () => {
    const { rerender } = render(
      <PageSlot index={0} photo={null} selectedPhoto={null} hintId="hint" onPlace={vi.fn()} onRemove={vi.fn()} onReAdd={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Slot 1: empty' })).toBeInTheDocument();
    rerender(
      <PageSlot index={0} photo={beach} selectedPhoto={null} hintId="hint" onPlace={vi.fn()} onRemove={vi.fn()} onReAdd={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Slot 1: Beach at sunset' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Beach at sunset' })).toBeInTheDocument();
  });

  it('places the selected photo from the keyboard', async () => {
    const { onPlace } = renderSlot({ selectedPhoto: dog });
    screen.getByRole('button', { name: 'Place Dog in the waves in slot 2' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith('p2');
  });

  it('does nothing when pressed with no photo selected', async () => {
    const { onPlace } = renderSlot();
    const slot = screen.getByRole('button', { name: 'Slot 2: empty' });
    expect(slot).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(slot);
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('accepts a photo dragged from the tray', () => {
    const { onPlace } = renderSlot();
    const slot = screen.getByRole('button', { name: 'Slot 2: empty' });
    const dataTransfer = { types: [PHOTO_DRAG_TYPE], getData: () => 'p2', dropEffect: 'none' };
    const dragOver = fireEvent.dragOver(slot, { dataTransfer });
    expect(dragOver).toBe(false);
    fireEvent.drop(slot, { dataTransfer });
    expect(onPlace).toHaveBeenCalledWith('p2');
  });

  it('ignores drags that are not tray photos', () => {
    const { onPlace } = renderSlot();
    const slot = screen.getByRole('button', { name: 'Slot 2: empty' });
    const dataTransfer = { types: ['Files'], getData: () => '' };
    expect(fireEvent.dragOver(slot, { dataTransfer })).toBe(true);
    fireEvent.drop(slot, { dataTransfer });
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('removes its photo with a named button', async () => {
    const { onRemove } = renderSlot({ photo: beach });
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo from slot 2' }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('shows a re-add placeholder for a missing photo', async () => {
    const { onReAdd } = renderSlot({ photo: { ...beach, missing: true } });
    expect(screen.getByRole('button', { name: 'Slot 2: beach.jpg (missing)' })).toHaveTextContent(
      'Photo missing',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Re-add photo beach.jpg' }));
    expect(onReAdd).toHaveBeenCalledWith('p1');
  });
});
