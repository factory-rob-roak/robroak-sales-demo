import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { contrastRatio, declarations, outlineColor, parseHex } from '../../../test/contrast';
import { LayoutPicker } from './LayoutPicker';
import css from './LayoutPicker.module.css?raw';

describe('LayoutPicker', () => {
  it('is a labeled radio group that reports the chosen layout', async () => {
    const onChange = vi.fn();
    render(<LayoutPicker layout="two-up" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Two up' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Collage' }));
    expect(onChange).toHaveBeenCalledWith('collage');
  });

  it('draws the focus ring where it has 3:1 contrast, even on the checked option (WCAG 1.4.11)', () => {
    // The ring is drawn outside the pill, on the white panel.
    expect(contrastRatio(outlineColor(css, '.option:has(.radio:focus-visible)'), parseHex('#fff'))).toBeGreaterThanOrEqual(3);
    // A ring around the radio itself would sit on the checked pill's dark background.
    const checkedBg = parseHex(declarations(css, '.option:has(.radio:checked)').background ?? '');
    const radioRing = declarations(css, '.radio:focus-visible').outline;
    expect(
      radioRing === undefined || contrastRatio(outlineColor(css, '.radio:focus-visible'), checkedBg) >= 3,
    ).toBe(true);
  });
});
