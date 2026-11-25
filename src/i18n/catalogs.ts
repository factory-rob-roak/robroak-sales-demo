import type { Locale } from './locales';
import { de } from './messages/de';
import { en, type Messages } from './messages/en';

export type { Messages };

export const CATALOGS: Record<Locale, Messages> = { en, de };
