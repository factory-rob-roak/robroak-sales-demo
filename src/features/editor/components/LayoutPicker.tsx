import { useId } from 'react';
import { LAYOUTS } from '../constants';
import type { LayoutId } from '../types';
import styles from './LayoutPicker.module.css';

interface LayoutPickerProps {
  layout: LayoutId;
  onChange: (layout: LayoutId) => void;
}

export function LayoutPicker({ layout, onChange }: LayoutPickerProps) {
  const name = useId();
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Layout</legend>
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
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
