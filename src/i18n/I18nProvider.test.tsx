import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as catalogs from './catalogs';
import { I18nProvider } from './I18nProvider';
import { useI18n } from './useI18n';

vi.mock('./catalogs', async (importOriginal) => {
  const actual = await importOriginal<typeof catalogs>();
  return { ...actual, loadCatalog: vi.fn(actual.loadCatalog) };
});

afterEach(() => {
  vi.mocked(catalogs.loadCatalog).mockClear();
});

function Page() {
  const { t, setLocale } = useI18n();
  return (
    <>
      <h1>{t.projects.heading}</h1>
      <button type="button" onClick={() => setLocale('de')}>
        de
      </button>
      <button type="button" onClick={() => setLocale('en')}>
        en
      </button>
    </>
  );
}

describe('I18nProvider catalog loading', () => {
  it('shows nothing until a non-English catalog arrives, then that language', async () => {
    const { container } = render(
      <I18nProvider initialLocale="de">
        <Page />
      </I18nProvider>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(await screen.findByRole('heading', { name: 'Deine Fotobücher' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'de');
  });

  it('falls back to English when the first catalog cannot be fetched', async () => {
    vi.mocked(catalogs.loadCatalog).mockRejectedValueOnce(new Error('offline'));
    render(
      <I18nProvider initialLocale="de">
        <Page />
      </I18nProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Your photo books' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });

  it('keeps the current language when a switch fails, and retries on the next choice', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Page />
      </I18nProvider>,
    );
    vi.mocked(catalogs.loadCatalog).mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'de' }));
    await vi.waitFor(() => expect(catalogs.loadCatalog).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: 'Your photo books' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'de' }));
    expect(await screen.findByRole('heading', { name: 'Deine Fotobücher' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'en' }));
    expect(await screen.findByRole('heading', { name: 'Your photo books' })).toBeInTheDocument();
  });
});
