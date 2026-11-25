import type { ChangeEvent, Ref } from 'react';
import { useI18n } from '../../../i18n/useI18n';
import styles from './AddPhotosButton.module.css';
import shared from './shared.module.css';

interface AddPhotosButtonProps {
  onFiles: (files: File[]) => void;
  inputRef?: Ref<HTMLInputElement>;
}

/** A label styled as a button, so the file input itself stays the keyboard-focusable control. */
export function AddPhotosButton({ onFiles, inputRef }: AddPhotosButtonProps) {
  const { t } = useI18n();
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Clearing the value lets the same file be chosen again after a failed upload.
    event.target.value = '';
    if (files.length > 0) onFiles(files);
  };

  return (
    <label className={styles.button}>
      {t.tray.addPhotos}
      <input
        ref={inputRef}
        type="file"
        className={shared.visuallyHidden}
        accept="image/*"
        multiple
        onChange={handleChange}
      />
    </label>
  );
}
