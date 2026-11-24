import { PhotoUploadError, type PhotoUploadClient, type UploadedPhoto } from './photoUpload';

export const DEFAULT_ACCEPTED_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

export interface StubPhotoUploadOptions {
  /** Simulated network latency per upload. Use 0 in tests. */
  latencyMs?: number;
  maxBytes?: number;
  acceptedTypes?: readonly string[];
  /** Return an error to make the upload of `file` fail after the latency. */
  failWith?: (file: File) => PhotoUploadError | undefined;
  createId?: () => string;
  createObjectUrl?: (file: File) => string;
}

function abortedError(fileName: string): PhotoUploadError {
  return new PhotoUploadError('aborted', fileName, `Upload of ${fileName} was canceled.`);
}

function wait(ms: number, fileName: string, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortedError(fileName));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** In-memory stand-in for the upload API, which is not live yet. */
export function createStubPhotoUploadClient(options: StubPhotoUploadOptions = {}): PhotoUploadClient {
  const {
    latencyMs = 300,
    maxBytes = DEFAULT_MAX_BYTES,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    failWith,
    createId = () => crypto.randomUUID(),
    createObjectUrl = (file: File) => URL.createObjectURL(file),
  } = options;

  return {
    async upload(file, { signal } = {}): Promise<UploadedPhoto> {
      if (signal?.aborted) throw abortedError(file.name);
      if (!acceptedTypes.includes(file.type)) {
        throw new PhotoUploadError(
          'unsupported-type',
          file.name,
          `${file.name} is not a supported image. Use JPEG, PNG, WebP, or GIF.`,
        );
      }
      if (file.size > maxBytes) {
        throw new PhotoUploadError(
          'too-large',
          file.name,
          `${file.name} is larger than ${formatMegabytes(maxBytes)}.`,
        );
      }
      await wait(latencyMs, file.name, signal);
      const injected = failWith?.(file);
      if (injected) throw injected;
      return { id: createId(), url: createObjectUrl(file), name: file.name };
    },
  };
}
