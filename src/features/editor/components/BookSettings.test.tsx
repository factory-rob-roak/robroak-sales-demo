import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { declarations } from '../../../test/contrast';
import { createDefaultDraft } from '../constants';
import { editorReducer } from '../editorReducer';
import { BookSettings } from './BookSettings';
import css from './BookSettings.module.css?raw';

function Harness() {
  const [draft, dispatch] = useReducer(editorReducer, undefined, () => createDefaultDraft());
  return (
    <>
      <BookSettings draft={draft} dispatch={dispatch} />
      <output aria-label="Draft">{`${draft.title}|${draft.theme}|${draft.format}|${draft.coverType}`}</output>
    </>
  );
}

const draftSummary = () => screen.getByRole('status', { name: 'Draft' });

describe('BookSettings', () => {
  it('shows the current settings with labeled controls', () => {
    render(<Harness />);
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('My Photo Book');
    expect(screen.getByRole('radio', { name: 'Classic' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Size' })).toHaveDisplayValue('8x8 Square');
    expect(screen.getByRole('combobox', { name: 'Cover' })).toHaveDisplayValue('Softcover');
  });

  it('edits the title', async () => {
    render(<Harness />);
    const title = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Maine 2026');
    expect(draftSummary()).toHaveTextContent('Maine 2026|classic');
  });

  it('picks a theme from the keyboard', async () => {
    render(<Harness />);
    screen.getByRole('radio', { name: 'Classic' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Modern' })).toBeChecked();
    expect(draftSummary()).toHaveTextContent('|modern|');
  });

  it('changes the size and cover type', async () => {
    render(<Harness />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Size' }), '11x8.5 Landscape');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cover' }), 'Lay-flat');
    expect(draftSummary()).toHaveTextContent('|landscape-11|layflat');
  });

  it('lets theme options wrap onto their own rows instead of overflowing the panel (WCAG 1.4.10, 1.4.12)', () => {
    // Two fixed columns overflowed at 320 px and with larger text spacing; wrapping only when needed avoids it.
    const columns = declarations(css, '.themes')['grid-template-columns'] ?? '';
    // Never wider than the panel, never narrower than an option, and never more than two per row.
    expect(columns).toMatch(
      /^repeat\(auto-fit, minmax\(min\(100%, max\([\d.]+rem, calc\(50% - 0\.25rem\)\)\), 1fr\)\)$/,
    );
    // An option is about 131 px wide, or 143 px with WCAG text spacing.
    const minRem = Number(/max\(([\d.]+)rem/.exec(columns)?.[1]);
    expect(minRem * 16).toBeGreaterThanOrEqual(140);
  });
});
