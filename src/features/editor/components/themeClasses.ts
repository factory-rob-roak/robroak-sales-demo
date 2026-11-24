import type { ThemeId } from '../types';
import themes from './themes.module.css';

export const THEME_CLASS: Record<ThemeId, string | undefined> = {
  classic: themes.classic,
  modern: themes.modern,
  kraft: themes.kraft,
  pastel: themes.pastel,
};
