import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { contrastRatio, declarations, outlineColor, parseHex } from '../test/contrast';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';
import css from './ProjectCard.module.css?raw';

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
});

it('opens the project from the keyboard', async () => {
  const onOpen = vi.fn();
  render(<ProjectCard project={project} onOpen={onOpen} />);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  expect(onOpen).toHaveBeenCalledWith('p1');
});

it('draws a focus ring with 3:1 contrast against the card (WCAG 1.4.11)', () => {
  const cardBg = parseHex(declarations(css, '.card').background ?? '');
  expect(contrastRatio(outlineColor(css, '.open:focus-visible'), cardBg)).toBeGreaterThanOrEqual(3);
});
