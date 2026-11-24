/** MIME type for dragging a tray photo onto a page slot. The payload is the photo id. */
export const PHOTO_DRAG_TYPE = 'application/x-photobook-photo-id';

export function setPhotoDragData(dataTransfer: DataTransfer, photoId: string): void {
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(PHOTO_DRAG_TYPE, photoId);
}

/** Usable during dragover, when browsers hide the payload but expose its types. */
export function isPhotoDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(PHOTO_DRAG_TYPE);
}

export function readPhotoDragData(dataTransfer: DataTransfer): string | null {
  const photoId = dataTransfer.getData(PHOTO_DRAG_TYPE);
  return photoId === '' ? null : photoId;
}
