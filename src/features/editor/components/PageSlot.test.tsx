import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Photo } from '../types';
import { PageSlot } from './PageSlot';
import { blend, contrastRatio, declarations, parseHex } from '../../../test/contrast';
import canvasCss from './PageCanvas.module.css?raw';
import slotCss from './PageSlot.module.css?raw';
import { PHOTO_DRAG_TYPE } from './photoDrag';
import themesCss from './themes.module.css?raw';

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
    expect(screen.getByRole('button', { name: 'Slot 1: Drop a photo here' })).toBeInTheDocument();
    rerender(
      <PageSlot index={0} photo={beach} selectedPhoto={null} hintId="hint" onPlace={vi.fn()} onRemove={vi.fn()} onReAdd={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Slot 1: Beach at sunset' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Beach at sunset' })).toBeInTheDocument();
  });

  it('places the selected photo from the keyboard', async () => {
    const { onPlace } = renderSlot({ selectedPhoto: dog });
    screen.getByRole('button', { name: 'Slot 2: Drop a photo here' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith('p2');
  });

  it('does nothing when pressed with no photo selected', async () => {
    const { onPlace } = renderSlot();
    const slot = screen.getByRole('button', { name: 'Slot 2: Drop a photo here' });
    expect(slot).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(slot);
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('accepts a photo dragged from the tray', () => {
    const { onPlace } = renderSlot();
    const slot = screen.getByRole('button', { name: 'Slot 2: Drop a photo here' });
    const dataTransfer = { types: [PHOTO_DRAG_TYPE], getData: () => 'p2', dropEffect: 'none' };
    const dragOver = fireEvent.dragOver(slot, { dataTransfer });
    expect(dragOver).toBe(false);
    fireEvent.drop(slot, { dataTransfer });
    expect(onPlace).toHaveBeenCalledWith('p2');
  });

  it('ignores drags that are not tray photos', () => {
    const { onPlace } = renderSlot();
    const slot = screen.getByRole('button', { name: 'Slot 2: Drop a photo here' });
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

  it('keeps keyboard focus on the slot after its photo is removed', async () => {
    function FilledSlot() {
      const [photo, setPhoto] = useState<Photo | null>(beach);
      return (
        <PageSlot
          index={1}
          photo={photo}
          selectedPhoto={null}
          hintId="hint"
          onPlace={vi.fn()}
          onRemove={() => setPhoto(null)}
          onReAdd={vi.fn()}
        />
      );
    }
    render(<FilledSlot />);
    screen.getByRole('button', { name: 'Remove photo from slot 2' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('button', { name: 'Remove photo from slot 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slot 2: Drop a photo here' })).toHaveFocus();
  });

  it('shows a re-add placeholder for a missing photo', async () => {
    const { onReAdd } = renderSlot({ photo: { ...beach, missing: true } });
    expect(screen.getByRole('button', { name: 'Slot 2: Photo missing, beach.jpg' })).toHaveTextContent(
      'Photo missing',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Re-add photo beach.jpg' }));
    expect(onReAdd).toHaveBeenCalledWith('p1');
  });
  it('includes its visible text in its accessible name (WCAG 2.5.3)', () => {
    const { rerender } = render(
      <PageSlot index={0} photo={null} selectedPhoto={dog} hintId="hint" onPlace={vi.fn()} onRemove={vi.fn()} onReAdd={vi.fn()} />,
    );
    const slot = screen.getByRole('button', { name: /^Slot 1/ });
    expect(slot).toHaveAccessibleName(expect.stringContaining(slot.textContent ?? ''));
    rerender(
      <PageSlot
        index={0}
        photo={{ ...beach, missing: true }}
        selectedPhoto={null}
        hintId="hint"
        onPlace={vi.fn()}
        onRemove={vi.fn()}
        onReAdd={vi.fn()}
      />,
    );
    expect(slot).toHaveTextContent('Photo missing');
    expect(slot).toHaveAccessibleName(expect.stringContaining('Photo missing'));
  });

  it.each(['classic', 'modern', 'kraft', 'pastel'])(
    'keeps placeholder text at 4.5:1 and the focus ring at 3:1 in the %s theme',
    (theme) => {
      const colors = declarations(themesCss, `.${theme}`);
      const pageBg = parseHex(colors['--page-bg'] ?? '');
      const pageFg = parseHex(colors['--page-fg'] ?? '');
      const accent = parseHex(colors['--accent'] ?? '');
      // Mirrors --slot-bg in PageCanvas.module.css: the page color tinted with the text color.
      const tint = /--slot-bg:\s*color-mix\(in srgb, var\(--page-fg\) (\d+)%/.exec(canvasCss)?.[1];
      const slotBg = blend(pageFg, pageBg, Number(tint) / 100);
      const opacity = Number(declarations(slotCss, '.placeholder').opacity ?? '1');
      expect(contrastRatio(blend(pageFg, slotBg, opacity), slotBg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(accent, pageBg)).toBeGreaterThanOrEqual(3);
    },
  );
});
