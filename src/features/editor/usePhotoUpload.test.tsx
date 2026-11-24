import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createStubPhotoUploadClient } from '../../api/createStubPhotoUploadClient';
import { PhotoUploadProvider } from '../../api/PhotoUploadProvider';
import { PhotoUploadError, type PhotoUploadClient, type UploadedPhoto } from '../../api/photoUpload';
import { usePhotoUpload } from './usePhotoUpload';

interface PendingUpload {
  file: File;
  signal: AbortSignal | undefined;
  resolve: (photo: UploadedPhoto) => void;
  reject: (error: unknown) => void;
}

function controllableClient() {
  const pending: PendingUpload[] = [];
  const client: PhotoUploadClient = {
    upload: (file, { signal } = {}) =>
      new Promise((resolve, reject) => {
        pending.push({ file, signal, resolve, reject });
      }),
  };
  return { client, pending };
}

function renderWithClient(client: PhotoUploadClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PhotoUploadProvider client={client}>{children}</PhotoUploadProvider>
  );
  return renderHook(() => usePhotoUpload(), { wrapper });
}

const file = (name: string, type = 'image/jpeg') => new File(['x'], name, { type });
const photo = (name: string): UploadedPhoto => ({ id: name, url: `blob:${name}`, name });

describe('usePhotoUpload', () => {
  it('counts concurrent uploads and resolves with successful photos in order', async () => {
    const { client, pending } = controllableClient();
    const { result } = renderWithClient(client);

    let uploaded: Promise<UploadedPhoto[]> = Promise.resolve([]);
    act(() => {
      uploaded = result.current.uploadFiles([file('a.jpg'), file('b.jpg'), file('c.jpg')]);
    });
    expect(result.current.inProgressCount).toBe(3);

    await act(async () => pending[1]?.resolve(photo('b.jpg')));
    expect(result.current.inProgressCount).toBe(2);

    await act(async () => {
      pending[2]?.reject(new PhotoUploadError('network', 'c.jpg', 'c.jpg could not be uploaded.'));
      pending[0]?.resolve(photo('a.jpg'));
    });

    await expect(uploaded).resolves.toEqual([photo('a.jpg'), photo('b.jpg')]);
    expect(result.current.inProgressCount).toBe(0);
    expect(result.current.errors).toEqual([
      { id: expect.any(String), fileName: 'c.jpg', code: 'network', message: 'c.jpg could not be uploaded.' },
    ]);
  });

  it('reports per-file validation errors from the stub and lets the UI dismiss them', async () => {
    const client = createStubPhotoUploadClient({ latencyMs: 0, createObjectUrl: (f) => `blob:${f.name}` });
    const { result } = renderWithClient(client);

    let photos: UploadedPhoto[] = [];
    await act(async () => {
      photos = await result.current.uploadFiles([file('ok.png', 'image/png'), file('doc.txt', 'text/plain')]);
    });

    expect(photos).toEqual([expect.objectContaining({ name: 'ok.png', url: 'blob:ok.png' })]);
    expect(result.current.errors).toHaveLength(1);
    const [failure] = result.current.errors;
    expect(failure).toMatchObject({ fileName: 'doc.txt', code: 'unsupported-type' });

    act(() => result.current.dismissError(failure?.id ?? ''));
    expect(result.current.errors).toEqual([]);
  });

  it('maps unexpected client errors to a network error', async () => {
    const client: PhotoUploadClient = { upload: () => Promise.reject(new TypeError('Failed to fetch')) };
    const { result } = renderWithClient(client);

    await act(async () => {
      await result.current.uploadFiles([file('a.jpg')]);
    });

    expect(result.current.errors[0]).toMatchObject({ fileName: 'a.jpg', code: 'network' });
  });

  it('aborts in-flight uploads on unmount without reporting errors', async () => {
    const { client, pending } = controllableClient();
    const { result, unmount } = renderWithClient(client);

    let uploaded: Promise<UploadedPhoto[]> = Promise.resolve([]);
    act(() => {
      uploaded = result.current.uploadFiles([file('a.jpg'), file('b.jpg')]);
    });
    await waitFor(() => expect(pending).toHaveLength(2));

    unmount();
    expect(pending.every((upload) => upload.signal?.aborted)).toBe(true);

    pending.forEach((upload) => upload.reject(new DOMException('Aborted', 'AbortError')));
    await expect(uploaded).resolves.toEqual([]);
  });
});
