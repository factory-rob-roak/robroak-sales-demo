export interface UploadedPhoto {
  id: string;
  /**
   * Display URL for the photo. The stub returns a `blob:` object URL, which
   * stays allocated until `URL.revokeObjectURL(url)` is called and does not
   * survive a page reload. Whoever removes a photo from the draft should
   * revoke `blob:` URLs; revoking any other URL is a harmless no-op.
   */
  url: string;
  name: string;
}

export interface PhotoUploadOptions {
  signal?: AbortSignal;
}

export interface PhotoUploadClient {
  /** Rejects with a `PhotoUploadError`. */
  upload(file: File, options?: PhotoUploadOptions): Promise<UploadedPhoto>;
}

export type PhotoUploadErrorCode = 'unsupported-type' | 'too-large' | 'network' | 'aborted';

export class PhotoUploadError extends Error {
  readonly code: PhotoUploadErrorCode;
  readonly fileName: string;

  constructor(code: PhotoUploadErrorCode, fileName: string, message: string) {
    super(message);
    this.name = 'PhotoUploadError';
    this.code = code;
    this.fileName = fileName;
  }
}

export function toPhotoUploadError(error: unknown, fileName: string): PhotoUploadError {
  if (error instanceof PhotoUploadError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new PhotoUploadError('aborted', fileName, `Upload of ${fileName} was canceled.`);
  }
  return new PhotoUploadError('network', fileName, `${fileName} could not be uploaded. Try again.`);
}
