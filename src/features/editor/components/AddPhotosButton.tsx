import type { ChangeEvent, Ref } from 'react';
import styles from './AddPhotosButton.module.css';
import shared from './shared.module.css';

interface AddPhotosButtonProps {
  onFiles: (files: File[]) => void;
  inputRef?: Ref<HTMLInputElement>;
}

/** A label styled as a button, so the file input itself stays the keyboard-focusable control. */
export function AddPhotosButton({ onFiles, inputRef }: AddPhotosButtonProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Clearing the value lets the same file be chosen again after a failed upload.
    event.target.value = '';
    if (files.length > 0) onFiles(files);
  };

  return (
    <label className={styles.button}>
      Add photos
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
