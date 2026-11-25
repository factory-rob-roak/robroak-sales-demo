import type { Locale } from './locales';
import { en, type Messages } from './messages/en';

export type { Messages };

/**
 * English ships in the entry chunk as the source and fallback. Every other
 * language is its own chunk, fetched only when someone uses it.
 */
const LOADERS: Record<Locale, () => Promise<Messages>> = {
  en: () => Promise.resolve(en),
  de: () => import('./messages/de').then((module) => module.de),
};

export function loadCatalog(locale: Locale): Promise<Messages> {
  return LOADERS[locale]();
}
