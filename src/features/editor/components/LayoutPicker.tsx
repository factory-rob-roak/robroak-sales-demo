import { useId } from 'react';
import { useI18n } from '../../../i18n/useI18n';
import { LAYOUTS } from '../constants';
import type { LayoutId } from '../types';
import styles from './LayoutPicker.module.css';

interface LayoutPickerProps {
  layout: LayoutId;
  onChange: (layout: LayoutId) => void;
}

export function LayoutPicker({ layout, onChange }: LayoutPickerProps) {
  const { t } = useI18n();
  const name = useId();
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{t.canvas.layout}</legend>
      {LAYOUTS.map((option) => (
        <label key={option.id} className={styles.option}>
          <input
            type="radio"
            name={name}
            className={styles.radio}
            value={option.id}
            checked={option.id === layout}
            onChange={() => onChange(option.id)}
          />
          {t.layouts[option.id]}
        </label>
      ))}
    </fieldset>
  );
}
