import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { LazyEditor } from './LazyEditor';

const project: Project = {
  id: 'p1',
  title: 'Summer in Maine',
  format: 'landscape-11',
  pageCount: 24,
  coverType: 'hardcover',
  updatedAt: '2026-11-01T12:00:00Z',
};

afterEach(() => {
  localStorage.clear();
});

it('announces and focuses a loading state, then hands focus to the editor', async () => {
  render(<LazyEditor project={project} onClose={vi.fn()} />);
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Loading the editor…');
  expect(status).toHaveFocus();
  expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');

  const heading = await screen.findByRole('heading', { level: 1, name: 'Summer in Maine' });
  expect(heading).toHaveFocus();
  expect(screen.queryByText('Loading the editor…')).not.toBeInTheDocument();
});
