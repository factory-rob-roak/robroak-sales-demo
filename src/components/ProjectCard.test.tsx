import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';

const project: Project = {
  id: 'p1',
  title: 'Summer in Maine',
  format: 'landscape-11',
  pageCount: 24,
  coverType: 'hardcover',
  updatedAt: '2026-11-01T12:00:00Z',
};

it('shows the project details and price', () => {
  render(<ProjectCard project={project} onOpen={() => {}} />);
  expect(screen.getByRole('heading', { name: 'Summer in Maine' })).toBeInTheDocument();
  expect(screen.getByText(/11x8.5 Landscape · Hardcover · 24/)).toBeInTheDocument();
  expect(screen.getByText('$65.99')).toBeInTheDocument();
  expect(screen.getByText('Edited Nov 1, 2026')).toHaveAttribute('datetime', '2026-11-01T12:00:00Z');
});

it('opens the project from the keyboard', async () => {
  const onOpen = vi.fn();
  render(<ProjectCard project={project} onOpen={onOpen} />);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  expect(onOpen).toHaveBeenCalledWith('p1');
});
