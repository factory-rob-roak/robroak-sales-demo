import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  localStorage.clear();
});

it('opens a project in the editor and comes back to the list', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Open Family Recipes' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Family Recipes' })).toHaveFocus();
  expect(screen.getByRole('combobox', { name: 'Size' })).toHaveDisplayValue('8.5x11 Portrait');
  expect(screen.queryByRole('region', { name: 'Projects' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Back to projects/ }));
  expect(screen.getByRole('heading', { level: 1, name: 'Your photo books' })).toHaveFocus();
  expect(screen.getByRole('region', { name: 'Projects' })).toBeInTheDocument();
});

it('keeps each project draft separately across visits', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Open Family Recipes' }));
  const title = await screen.findByRole('textbox', { name: 'Title' });
  await user.clear(title);
  await user.type(title, 'Grandma’s Kitchen');
  await user.click(screen.getByRole('button', { name: /Back to projects/ }));

  await user.click(screen.getByRole('button', { name: 'Open Summer in Maine' }));
  expect(screen.getByRole('heading', { level: 1, name: 'Summer in Maine' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Back to projects/ }));

  await user.click(screen.getByRole('button', { name: 'Open Family Recipes' }));
  expect(screen.getByRole('heading', { level: 1, name: 'Grandma’s Kitchen' })).toBeInTheDocument();
});
