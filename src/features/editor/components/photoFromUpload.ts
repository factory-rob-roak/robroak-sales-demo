import type { UploadedPhoto } from '../../../api/photoUpload';
import type { Photo } from '../types';

/** A starting description from the file name, for example "IMG_2041.jpg" becomes "IMG 2041". */
export function altFromFileName(fileName: string, fallback: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  return base.replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim() || fallback;
}

export function toEditorPhoto({ id, url, name }: UploadedPhoto, fallbackAlt: string): Photo {
  return { id, url, name, alt: altFromFileName(name, fallbackAlt) };
}
