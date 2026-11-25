import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadCatalog, type Messages } from './catalogs';
import { createI18n } from './i18n';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { en } from './messages/en';
import { I18nContext } from './useI18n';

interface LoadedCatalog {
  locale: Locale;
  messages: Messages;
}

const SOURCE: LoadedCatalog = { locale: 'en', messages: en };

interface I18nProviderProps {
  initialLocale?: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale = DEFAULT_LOCALE, children }: I18nProviderProps) {
  const [requested, setRequested] = useState<Locale>(initialLocale);
  const [loaded, setLoaded] = useState<LoadedCatalog | null>(initialLocale === SOURCE.locale ? SOURCE : null);

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

  const value = useMemo(
    () => (loaded === null ? null : createI18n(loaded.locale, loaded.messages, setRequested)),
    [loaded],
  );

  // Screen readers pick their pronunciation from the document language.
  useEffect(() => {
    if (loaded !== null) document.documentElement.lang = loaded.locale;
  }, [loaded]);

  // Waiting for the first non-English catalog avoids a flash of English text.
  if (value === null) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
