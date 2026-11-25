import { useCallback, useEffect, useRef, type ChangeEvent, type RefObject } from 'react';
import { useI18n } from '../../../i18n/useI18n';
import type { EditorAction } from '../types';
import { usePhotoUpload, type PhotoUploadFailure } from '../usePhotoUpload';
import { toEditorPhoto } from './photoFromUpload';

export interface TrayUploads {
  onAddFiles: (files: File[]) => void;
  inProgressCount: number;
  errors: readonly PhotoUploadFailure[];
  onDismissError: (id: string) => void;
  /** Opens a file chooser and points the photo at the chosen upload, keeping its slots. */
  reAddPhoto: (photoId: string) => void;
  reAddInput: {
    ref: RefObject<HTMLInputElement | null>;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  };
}

/**
 * Uploads files through the provided client and adds the ones that succeed to
 * the draft. Object URLs created here are revoked when the editor unmounts:
 * history can bring back any photo until then, and storage marks blob: photos
 * missing on the next load anyway.
 */
export function useTrayUploads(dispatch: (action: EditorAction) => void): TrayUploads {
  const { uploadFiles, inProgressCount, errors, dismissError } = usePhotoUpload();
  const { fallbackAlt } = useI18n().t.tray;
  const createdUrls = useRef(new Set<string>());
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoId = useRef<string | null>(null);

  useEffect(() => {
    const urls = createdUrls.current;
    return () => {
      urls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      urls.clear();
    };
  }, []);

  const upload = useCallback(
    async (files: File[]) => {
      const uploaded = await uploadFiles(files);
      uploaded.forEach((photo) => createdUrls.current.add(photo.url));
      return uploaded;
    },
    [uploadFiles],
  );

  const onAddFiles = useCallback(
    async (files: File[]) => {
      const uploaded = await upload(files);
      if (uploaded.length > 0) {
        dispatch({ type: 'addPhotos', photos: uploaded.map((photo) => toEditorPhoto(photo, fallbackAlt)) });
      }
    },
    [upload, dispatch, fallbackAlt],
  );

  const reAddPhoto = useCallback((photoId: string) => {
    pendingPhotoId.current = photoId;
    inputRef.current?.click();
  }, []);

  const onChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      const photoId = pendingPhotoId.current;
      pendingPhotoId.current = null;
      if (!file || photoId === null) return;
      const [uploaded] = await upload([file]);
      if (uploaded) dispatch({ type: 'replacePhoto', photoId, url: uploaded.url, name: uploaded.name });
    },
    [upload, dispatch],
  );

  return {
    onAddFiles,
    inProgressCount,
    errors,
    onDismissError: dismissError,
    reAddPhoto,
    reAddInput: { ref: inputRef, onChange },
  };
}
