import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadCatalog, type Messages } from './catalogs';
import { createI18n } from './i18n';
import { createLocaleStore, resolveInitialLocale, type LocaleStore } from './localePreference';
import type { Locale } from './locales';
import { en } from './messages/en';
import { I18nContext } from './useI18n';

interface LoadedCatalog {
  locale: Locale;
  messages: Messages;
}

const SOURCE: LoadedCatalog = { locale: 'en', messages: en };

interface I18nProviderProps {
  /** Skips the saved choice and the browser languages, for tests and previews. */
  initialLocale?: Locale;
  /** Where the chosen language is kept. Defaults to localStorage. */
  store?: LocaleStore;
  children: ReactNode;
}

export function I18nProvider({ initialLocale, store, children }: I18nProviderProps) {
  const [localeStore] = useState(() => store ?? createLocaleStore());
  const [requested, setRequested] = useState<Locale>(
    () => initialLocale ?? resolveInitialLocale(localeStore, navigator.languages),
  );
  const [loaded, setLoaded] = useState<LoadedCatalog | null>(requested === SOURCE.locale ? SOURCE : null);

  useEffect(() => {
    if (loaded?.locale === requested) return;
    let current = true;
    loadCatalog(requested).then(
      (messages) => {
        if (current) setLoaded({ locale: requested, messages });
      },
      () => {
        // A language that can't be fetched leaves the current one in place, so choosing it again retries.
        if (!current) return;
        setRequested(loaded?.locale ?? SOURCE.locale);
        if (loaded === null) setLoaded(SOURCE);
      },
    );
    return () => {
      current = false;
    };
  }, [requested, loaded]);

  // Only an explicit choice is saved, so a browser default keeps following the browser.
  const setLocale = useCallback(
    (next: Locale) => {
      setRequested(next);
      localeStore.save(next);
    },
    [localeStore],
  );
  const value = useMemo(
    () => (loaded === null ? null : createI18n(loaded.locale, loaded.messages, setLocale)),
    [loaded, setLocale],
  );

  // Screen readers pick their pronunciation from the document language.
  useEffect(() => {
    if (loaded !== null) document.documentElement.lang = loaded.locale;
  }, [loaded]);

  // Waiting for the first non-English catalog avoids a flash of English text.
  if (value === null) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
