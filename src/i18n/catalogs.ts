import type { Locale } from './locales';
import { en, type Messages } from './messages/en';

export type { Messages };

export const CATALOGS: Record<Locale, Messages> = { en };
