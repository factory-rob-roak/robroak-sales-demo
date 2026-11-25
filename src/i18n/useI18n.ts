import { createContext, useContext } from 'react';
import { createI18n, type I18n } from './i18n';
import { DEFAULT_LOCALE } from './locales';

// Without a provider, components render in the default language and cannot switch.
export const I18nContext = createContext<I18n>(createI18n(DEFAULT_LOCALE, () => {}));

export function useI18n(): I18n {
  return useContext(I18nContext);
}
