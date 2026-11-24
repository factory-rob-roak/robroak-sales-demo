import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoUploadClient } from '../../api/PhotoUploadProvider';
import {
  toPhotoUploadError,
  type PhotoUploadErrorCode,
  type UploadedPhoto,
} from '../../api/photoUpload';

export interface PhotoUploadFailure {
  id: string;
  fileName: string;
  code: PhotoUploadErrorCode;
  message: string;
}

export interface PhotoUploadState {
  /**
   * Uploads every file concurrently and resolves with the photos that
   * succeeded, in input order. Never rejects; failures land in `errors`.
   */
  uploadFiles: (files: FileList | readonly File[]) => Promise<UploadedPhoto[]>;
  inProgressCount: number;
  errors: readonly PhotoUploadFailure[];
  dismissError: (id: string) => void;
}

/** Uploads through the client from `PhotoUploadProvider`; in-flight uploads abort on unmount. */
export function usePhotoUpload(): PhotoUploadState {
  const client = usePhotoUploadClient();
  const [inProgressCount, setInProgressCount] = useState(0);
  const [errors, setErrors] = useState<readonly PhotoUploadFailure[]>([]);
  const controllers = useRef(new Set<AbortController>());
  const nextErrorId = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const active = controllers.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.forEach((controller) => controller.abort());
      active.clear();
    };
  }, []);

  const uploadOne = useCallback(
    async (file: File): Promise<UploadedPhoto | null> => {
      const controller = new AbortController();
      controllers.current.add(controller);
      setInProgressCount((count) => count + 1);
      try {
        return await client.upload(file, { signal: controller.signal });
      } catch (error) {
        const failure = toPhotoUploadError(error, file.name);
        if (failure.code !== 'aborted' && mounted.current) {
          nextErrorId.current += 1;
          const id = `upload-error-${nextErrorId.current}`;
          setErrors((current) => [
            ...current,
            { id, fileName: failure.fileName, code: failure.code, message: failure.message },
          ]);
        }
        return null;
      } finally {
        controllers.current.delete(controller);
        if (mounted.current) setInProgressCount((count) => count - 1);
      }
    },
    [client],
  );

  const uploadFiles = useCallback(
    async (files: FileList | readonly File[]) => {
      const results = await Promise.all(Array.from(files, uploadOne));
      return results.filter((photo): photo is UploadedPhoto => photo !== null);
    },
    [uploadOne],
  );

  const dismissError = useCallback((id: string) => {
    setErrors((current) => current.filter((failure) => failure.id !== id));
  }, []);

  return { uploadFiles, inProgressCount, errors, dismissError };
}
