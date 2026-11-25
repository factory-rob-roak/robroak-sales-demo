import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { LazyEditor } from './LazyEditor';

vi.mock('./Editor', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

const project: Project = {
  id: 'p1',
  title: 'Summer in Maine',
  format: 'landscape-11',
  pageCount: 24,
  coverType: 'hardcover',
  updatedAt: '2026-11-01T12:00:00Z',
};

it('shows an error with a way back when the editor fails to load', async () => {
  const onClose = vi.fn();
  render(<LazyEditor project={project} onClose={onClose} />);

  const heading = await screen.findByRole('heading', { level: 1, name: 'Couldn’t open Summer in Maine' });
  expect(heading).toHaveFocus();
  expect(screen.getByRole('alert')).toHaveTextContent('reload the page to try again');

  await userEvent.click(screen.getByRole('button', { name: /Back to projects/ }));
  expect(onClose).toHaveBeenCalledOnce();
});
