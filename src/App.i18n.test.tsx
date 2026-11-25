import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { loadCatalog } from './i18n/catalogs';
import { I18nProvider } from './i18n/I18nProvider';
import type { Locale } from './i18n/locales';
import { en } from './i18n/messages/en';

afterEach(() => {
  localStorage.clear();
});

function renderApp(locale: Locale) {
  return render(
    <I18nProvider initialLocale={locale}>
      <App />
    </I18nProvider>,
  );
}

/** Static strings by dotted path, so a rendered page can be checked for untranslated English. */
function staticStrings(catalog: object, prefix = ''): Map<string, string> {
  const strings = new Map<string, string>();
  for (const [key, value] of Object.entries(catalog) as Array<[string, unknown]>) {
    const path = `${prefix}${key}`;
    if (typeof value === 'string') strings.set(path, value);
    else if (typeof value === 'object' && value !== null) {
      staticStrings(value, `${path}.`).forEach((text, nested) => strings.set(nested, text));
    }
  }
  return strings;
}

/** Visible text plus the accessible names and placeholders a screen reader or sighted user meets. */
function pageText(): string {
  const attributes = Array.from(document.body.querySelectorAll('[aria-label], [placeholder]'), (element) =>
    [element.getAttribute('aria-label'), element.getAttribute('placeholder')].join(' '),
  );
  return [document.body.textContent, ...attributes].join('\n');
}

async function expectNoEnglish(locale: Locale) {
  const translated = staticStrings(await loadCatalog(locale));
  const text = pageText();
  for (const [path, english] of staticStrings(en)) {
    const own = translated.get(path) ?? '';
    // Skip words that are the same in both languages, like "Layout" or "Pastel" inside "Pastell".
    if (own.includes(english)) continue;
    expect(text, `${locale} page shows English ${path}: "${english}"`).not.toMatch(
      new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
    );
  }
}

describe('App in German', () => {
  it('shows the project list with German copy, dates, and prices', async () => {
    renderApp('de');
    expect(await screen.findByRole('heading', { level: 1, name: 'Deine Fotobücher' })).toBeInTheDocument();
    const card = within(screen.getByRole('article', { name: 'Summer in Maine' }));
    expect(card.getByText('11 × 8,5 Zoll, Querformat · Hardcover · 24 Seiten')).toBeInTheDocument();
    expect(card.getByText('Bearbeitet am 01.11.2026')).toBeInTheDocument();
    expect(card.getByText('65,99 $')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'de');
    await expectNoEnglish('de');
  });

  it('shows the editor in German', async () => {
    const user = userEvent.setup();
    renderApp('de');
    await user.click(await screen.findByRole('button', { name: 'Family Recipes öffnen' }));
    expect(screen.getByRole('combobox', { name: 'Format' })).toHaveDisplayValue('8,5 × 11 Zoll, Hochformat');
    expect(screen.getByRole('heading', { name: 'Doppelseite 1 von 2' })).toBeInTheDocument();
    expect(screen.getByText('2 Doppelseiten · 4 gedruckte Seiten')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buch bestellen' })).toHaveAccessibleDescription(
      'Füge 16 weitere Seiten hinzu, um das Minimum von 20 Seiten zu erreichen.',
    );
    expect(screen.getByText('Bücher gibt es ab 39,99 $ für 20 Seiten.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Zoom' })).toHaveTextContent('100 %');
    await expectNoEnglish('de');
  });
});
