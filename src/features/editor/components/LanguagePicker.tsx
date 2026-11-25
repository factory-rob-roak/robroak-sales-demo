import type { ChangeEvent } from 'react';
import { isLocale, LOCALE_NAMES, LOCALES } from '../../../i18n/locales';
import { useI18n } from '../../../i18n/useI18n';
import styles from './LanguagePicker.module.css';

export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isLocale(event.target.value)) setLocale(event.target.value);
  };

  return (
    <label className={styles.picker}>
      {t.toolbar.language}
      <select className={styles.select} value={locale} onChange={onChange}>
        {LOCALES.map((option) => (
          <option key={option} value={option} lang={option}>
            {LOCALE_NAMES[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
