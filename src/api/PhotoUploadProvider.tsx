import { createContext, useContext, type ReactNode } from 'react';
import { createStubPhotoUploadClient } from './createStubPhotoUploadClient';
import type { PhotoUploadClient } from './photoUpload';

// The default stub holds no state, so sharing one instance is safe.
const PhotoUploadContext = createContext<PhotoUploadClient>(createStubPhotoUploadClient());

interface PhotoUploadProviderProps {
  client: PhotoUploadClient;
  children: ReactNode;
}

/** Swaps the upload client for its subtree, for example the real API client or a test double. */
export function PhotoUploadProvider({ client, children }: PhotoUploadProviderProps) {
  return <PhotoUploadContext.Provider value={client}>{children}</PhotoUploadContext.Provider>;
}

/** Returns the nearest provided client, or the in-memory stub when none is provided. */
export function usePhotoUploadClient(): PhotoUploadClient {
  return useContext(PhotoUploadContext);
}
