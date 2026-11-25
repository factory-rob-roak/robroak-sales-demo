import { afterEach, describe, expect, it } from 'vitest';
import {
  createLocaleStore,
  LOCALE_STORAGE_KEY,
  localeFromLanguages,
  resolveInitialLocale,
} from './localePreference';

afterEach(() => {
  localStorage.clear();
});

describe('createLocaleStore', () => {
  it('saves a versioned choice and loads it back', () => {
    const store = createLocaleStore();
    expect(store.load()).toEqual({ status: 'empty' });
    expect(store.save('fr')).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(LOCALE_STORAGE_KEY) ?? '')).toEqual({ version: 1, locale: 'fr' });
    expect(store.load()).toEqual({ status: 'loaded', value: 'fr' });
  });

  it.each([
    ['an unsupported locale', JSON.stringify({ version: 1, locale: 'es' })],
    ['a newer version', JSON.stringify({ version: 2, locale: 'de' })],
    ['bad JSON', '{'],
  ])('treats %s as invalid', (_, raw) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, raw);
    expect(createLocaleStore().load()).toEqual({ status: 'invalid' });
  });

  it('reports unavailable storage instead of throwing', () => {
    const store = createLocaleStore(null);
    expect(store.load()).toEqual({ status: 'unavailable' });
    expect(store.save('de')).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('localeFromLanguages', () => {
  it.each([
    [['de-AT', 'en'], 'de'],
    [['FR-ca'], 'fr'],
    [['en-GB', 'de'], 'en'],
    [['es', 'fr'], 'fr'],
    [['es'], 'en'],
    [[], 'en'],
  ] as const)('picks the first supported language from %j', (languages, expected) => {
    expect(localeFromLanguages(languages)).toBe(expected);
  });
});

describe('resolveInitialLocale', () => {
  it('prefers the saved choice over the browser', () => {
    const store = createLocaleStore();
    store.save('en');
    expect(resolveInitialLocale(store, ['de-DE'])).toBe('en');
  });

  it('follows the browser when nothing usable is saved', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'not json');
    expect(resolveInitialLocale(createLocaleStore(), ['fr-FR'])).toBe('fr');
  });
});
