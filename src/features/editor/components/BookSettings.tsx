import { useId, type ChangeEvent } from 'react';
import { useI18n } from '../../../i18n/useI18n';
import { COVER_LABELS, FORMAT_LABELS, type BookFormat, type CoverType } from '../../../types';
import { THEMES } from '../constants';
import type { BookDraft, EditorAction } from '../types';
import styles from './BookSettings.module.css';
import { cx } from './classNames';
import { THEME_CLASS } from './themeClasses';

interface BookSettingsProps {
  draft: BookDraft;
  dispatch: (action: EditorAction) => void;
}

function isFormat(value: string): value is BookFormat {
  return Object.hasOwn(FORMAT_LABELS, value);
}

function isCoverType(value: string): value is CoverType {
  return Object.hasOwn(COVER_LABELS, value);
}

export function BookSettings({ draft, dispatch }: BookSettingsProps) {
  const { t } = useI18n();
  const headingId = useId();
  const themeName = useId();

  const onFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isFormat(event.target.value)) dispatch({ type: 'setFormat', format: event.target.value });
  };
  const onCoverChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isCoverType(event.target.value)) dispatch({ type: 'setCoverType', coverType: event.target.value });
  };

  return (
    <section className={styles.settings} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {t.settings.heading}
      </h2>
      <label className={styles.field}>
        {t.settings.title}
        <input
          className={styles.control}
          value={draft.title}
          onChange={(event) => dispatch({ type: 'setTitle', title: event.target.value })}
        />
      </label>
      <fieldset className={styles.themes}>
        <legend className={styles.legend}>{t.settings.theme}</legend>
        {THEMES.map((theme) => (
          <label key={theme.id} className={styles.theme}>
            <input
              type="radio"
              name={themeName}
              className={styles.radio}
              value={theme.id}
              checked={draft.theme === theme.id}
              onChange={() => dispatch({ type: 'setTheme', theme: theme.id })}
            />
            <span className={cx(styles.swatch, THEME_CLASS[theme.id])} aria-hidden="true" />
            {t.themes[theme.id]}
          </label>
        ))}
      </fieldset>
      <label className={styles.field}>
        {t.settings.size}
        <select className={styles.control} value={draft.format} onChange={onFormatChange}>
          {Object.entries(t.formats).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        {t.settings.cover}
        <select className={styles.control} value={draft.coverType} onChange={onCoverChange}>
          {Object.entries(t.covers).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
