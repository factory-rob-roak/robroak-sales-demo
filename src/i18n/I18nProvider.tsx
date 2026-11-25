import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createI18n } from './i18n';
import { DEFAULT_LOCALE, type Locale } from './locales';
import { I18nContext } from './useI18n';

interface I18nProviderProps {
  initialLocale?: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale = DEFAULT_LOCALE, children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const value = useMemo(() => createI18n(locale, setLocale), [locale]);

  // Screen readers pick their pronunciation from the document language.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
