import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../../App';
import { I18nProvider } from '../../../i18n/I18nProvider';
import { LOCALE_STORAGE_KEY } from '../../../i18n/localePreference';

let browserLanguages: readonly string[] = ['de-DE', 'en'];

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockImplementation(() => browserLanguages);
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
}

it('starts in the browser language and saves nothing until a language is picked', async () => {
  renderApp();
  expect(await screen.findByRole('heading', { level: 1, name: 'Deine Fotobücher' })).toBeInTheDocument();
  expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
});

it('switches language from the editor with the keyboard and keeps the choice', async () => {
  const user = userEvent.setup();
  const { unmount } = renderApp();
  await user.click(await screen.findByRole('button', { name: 'Family Recipes öffnen' }));

  screen.getByRole('button', { name: 'Wiederholen' }).focus();
  await user.tab();
  const picker = screen.getByRole('combobox', { name: 'Sprache' });
  expect(picker).toHaveFocus();
  expect(picker).toHaveDisplayValue('Deutsch');

  await user.selectOptions(picker, 'Français');
  expect(await screen.findByRole('combobox', { name: 'Langue' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Commander le livre' })).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute('lang', 'fr');

  await user.click(screen.getByRole('button', { name: /Retour aux projets/ }));
  expect(screen.getByRole('heading', { level: 1, name: 'Vos livres photo' })).toBeInTheDocument();

  unmount();
  renderApp();
  expect(await screen.findByRole('heading', { level: 1, name: 'Vos livres photo' })).toBeInTheDocument();
});

it('keeps a saved choice even when the browser language changes', async () => {
  const user = userEvent.setup();
  const { unmount } = renderApp();
  await user.click(await screen.findByRole('button', { name: 'Family Recipes öffnen' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Sprache' }), 'English');
  expect(screen.getByRole('button', { name: 'Order book' })).toBeInTheDocument();
  unmount();

  browserLanguages = ['fr-FR'];
  renderApp();
  expect(screen.getByRole('heading', { level: 1, name: 'Your photo books' })).toBeInTheDocument();
  browserLanguages = ['de-DE', 'en'];
});

it('names each language in that language', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(await screen.findByRole('button', { name: 'Family Recipes öffnen' }));
  const options = within(screen.getByRole('combobox', { name: 'Sprache' })).getAllByRole('option');
  expect(options.map((option) => [option.textContent, option.getAttribute('lang')])).toEqual([
    ['English', 'en'],
    ['Deutsch', 'de'],
    ['Français', 'fr'],
  ]);
});
