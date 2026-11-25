import { createVersionedStore, type VersionedStore } from '../features/editor/storage';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

export const LOCALE_STORAGE_KEY = 'photo-book:locale';
export const LOCALE_STORAGE_VERSION = 1;

export type LocaleStore = VersionedStore<Locale>;

export function createLocaleStore(storage?: Storage | null): LocaleStore {
  return createVersionedStore({
    storage,
    key: LOCALE_STORAGE_KEY,
    version: LOCALE_STORAGE_VERSION,
    field: 'locale',
    parse: (value) => (isLocale(value) ? value : null),
  });
}

/** The first browser language we support, matched on its primary subtag ("de-AT" is German). */
export function localeFromLanguages(languages: readonly string[]): Locale {
  for (const language of languages) {
    const primary = language.split('-')[0]?.toLowerCase();
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

/** A saved choice wins; until someone picks a language, follow the browser. */
export function resolveInitialLocale(store: LocaleStore, languages: readonly string[]): Locale {
  const saved = store.load();
  return saved.status === 'loaded' ? saved.value : localeFromLanguages(languages);
}
