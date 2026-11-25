import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATALOGS, type Messages } from './catalogs';
import { createFormatters } from './format';
import { createI18n, type I18n } from './i18n';
import { I18nProvider } from './I18nProvider';
import { DEFAULT_LOCALE, INTL_LOCALE, isLocale, LOCALES } from './locales';
import { en } from './messages/en';
import { useI18n } from './useI18n';

/** Each leaf's dotted path and kind, so catalogs can be compared shape for shape. */
function shape(catalog: object, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]: [string, unknown]) => {
    const path = `${prefix}${key}`;
    if (typeof value === 'object' && value !== null) return shape(value, `${path}.`);
    return [`${path}:${typeof value}`];
  });
}

describe('catalogs', () => {
  it('give every locale exactly the keys of the English catalog', () => {
    const source = shape(en).sort();
    for (const locale of LOCALES) {
      expect(shape(CATALOGS[locale]).sort(), locale).toEqual(source);
    }
  });

  it('give every locale an Intl tag', () => {
    for (const locale of LOCALES) expect(INTL_LOCALE[locale]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
  });

  it('reject a catalog with a missing key at compile time', () => {
    type MissingHeading = Omit<Messages, 'projects'> & { projects: Omit<Messages['projects'], 'heading'> };
    const { heading, ...projects } = en.projects;
    const incomplete: MissingHeading = { ...en, projects };
    // @ts-expect-error A catalog without projects.heading is not a Messages.
    const catalog: Messages = incomplete;
    expect(catalog.projects).not.toHaveProperty('heading');
    expect(heading).toBe('Your photo books');
  });
});

describe('isLocale', () => {
  it('accepts supported locales only', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('xx')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('createFormatters', () => {
  const { number, percent, plural } = createFormatters('en');

  it('formats numbers and percentages', () => {
    expect(number(1234)).toBe('1,234');
    expect(percent(125)).toBe('125%');
  });

  it('picks plural forms and falls back to other', () => {
    expect(plural(1, { one: 'page', other: 'pages' })).toBe('page');
    expect(plural(2, { one: 'page', other: 'pages' })).toBe('pages');
  });
});

describe('createI18n', () => {
  it('formats dates from strings and Date objects', () => {
    const i18n = createI18n(DEFAULT_LOCALE, () => {});
    expect(i18n.formatDate('2026-11-01T12:00:00Z')).toBe('Nov 1, 2026');
    expect(i18n.formatDate(new Date(2026, 8, 2))).toBe('Sep 2, 2026');
    expect(i18n.formatNumber(1000)).toBe('1,000');
    expect(i18n.formatCents(4499)).toBe('$44.99');
  });
});

function Heading() {
  const { t } = useI18n();
  return <h1>{t.projects.heading}</h1>;
}

describe('I18nProvider', () => {
  it('provides the catalog and sets the document language', () => {
    render(
      <I18nProvider>
        <Heading />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Your photo books' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });

  it('keeps the same context value across renders while the locale is unchanged', () => {
    const seen: I18n[] = [];
    function Probe() {
      seen.push(useI18n());
      return null;
    }
    const { rerender } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    rerender(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(seen).toHaveLength(2);
    expect(seen[1]).toBe(seen[0]);
    expect(seen[1]?.t).toBe(seen[0]?.t);
    expect(seen[1]?.formatCents).toBe(seen[0]?.formatCents);
  });

  it('falls back to English without a provider', () => {
    render(<Heading />);
    expect(screen.getByRole('heading', { name: 'Your photo books' })).toBeInTheDocument();
  });
});
