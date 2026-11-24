import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStubPhotoUploadClient } from './createStubPhotoUploadClient';
import { PhotoUploadError } from './photoUpload';

function imageFile(name = 'beach.jpg', type = 'image/jpeg', bytes = 10): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function testClient(options: Parameters<typeof createStubPhotoUploadClient>[0] = {}) {
  return createStubPhotoUploadClient({
    latencyMs: 0,
    createId: () => 'photo-1',
    createObjectUrl: (file) => `blob:test/${file.name}`,
    ...options,
  });
}

async function uploadError(promise: Promise<unknown>): Promise<PhotoUploadError> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof PhotoUploadError)) throw new Error('expected a PhotoUploadError');
  return error;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createStubPhotoUploadClient', () => {
  it('returns an uploaded photo with an id, object URL, and file name', async () => {
    await expect(testClient().upload(imageFile())).resolves.toEqual({
      id: 'photo-1',
      url: 'blob:test/beach.jpg',
      name: 'beach.jpg',
    });
  });

  it('rejects files that are not supported images', async () => {
    const error = await uploadError(testClient().upload(imageFile('notes.pdf', 'application/pdf')));
    expect(error.code).toBe('unsupported-type');
    expect(error.fileName).toBe('notes.pdf');
    expect(error.message).toMatch(/notes\.pdf is not a supported image/);
  });

  it('rejects files over the size limit', async () => {
    const maxBytes = 2 * 1024 * 1024;
    const error = await uploadError(testClient({ maxBytes }).upload(imageFile('big.png', 'image/png', maxBytes + 1)));
    expect(error.code).toBe('too-large');
    expect(error.message).toBe('big.png is larger than 2 MB.');
  });

  it('accepts a file exactly at the size limit', async () => {
    await expect(testClient({ maxBytes: 10 }).upload(imageFile())).resolves.toMatchObject({ name: 'beach.jpg' });
  });

  it('fails with an injected error', async () => {
    const failWith = (file: File) => new PhotoUploadError('network', file.name, 'Server unavailable');
    const error = await uploadError(testClient({ failWith }).upload(imageFile()));
    expect(error.code).toBe('network');
    expect(error.message).toBe('Server unavailable');
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await uploadError(testClient().upload(imageFile(), { signal: controller.signal }));
    expect(error.code).toBe('aborted');
  });

  it('waits for the configured latency and can be aborted while waiting', async () => {
    vi.useFakeTimers();
    const client = testClient({ latencyMs: 1000 });

    const finished = vi.fn();
    void client.upload(imageFile()).then(finished);
    await vi.advanceTimersByTimeAsync(999);
    expect(finished).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(finished).toHaveBeenCalledWith(expect.objectContaining({ name: 'beach.jpg' }));

    const controller = new AbortController();
    const aborted = uploadError(client.upload(imageFile(), { signal: controller.signal }));
    controller.abort();
    expect((await aborted).code).toBe('aborted');
  });

  it('uses crypto ids and object URLs by default', async () => {
    // jsdom does not implement URL.createObjectURL.
    const original = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:default');
    try {
      const photo = await createStubPhotoUploadClient({ latencyMs: 0 }).upload(imageFile());
      expect(photo.url).toBe('blob:default');
      expect(photo.id).toMatch(/^[0-9a-f-]{36}$/);
    } finally {
      URL.createObjectURL = original;
    }
  });
});
