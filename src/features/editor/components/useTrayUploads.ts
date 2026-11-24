import { useCallback } from 'react';
import type { EditorAction } from '../types';
import { usePhotoUpload } from '../usePhotoUpload';
import { toEditorPhoto } from './photoFromUpload';
import type { TrayUploads } from './PhotoTray';

/** Uploads files through the provided client and adds the ones that succeed to the draft. */
export function useTrayUploads(dispatch: (action: EditorAction) => void): TrayUploads {
  const { uploadFiles, inProgressCount, errors, dismissError } = usePhotoUpload();

  const onAddFiles = useCallback(
    async (files: File[]) => {
      const uploaded = await uploadFiles(files);
      if (uploaded.length > 0) dispatch({ type: 'addPhotos', photos: uploaded.map(toEditorPhoto) });
    },
    [uploadFiles, dispatch],
  );

  return { onAddFiles, inProgressCount, errors, onDismissError: dismissError };
}
