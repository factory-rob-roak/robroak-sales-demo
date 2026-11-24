import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { createStubPhotoUploadClient } from '../../../api/createStubPhotoUploadClient';
import type { PhotoUploadClient, UploadedPhoto } from '../../../api/photoUpload';
import { PhotoUploadProvider } from '../../../api/PhotoUploadProvider';
import { editorReducer } from '../editorReducer';
import type { BookDraft } from '../types';
import { altFromFileName } from './photoFromUpload';
import { PhotoTray } from './PhotoTray';
import { useTrayUploads } from './useTrayUploads';

const emptyDraft: BookDraft = {
  title: 'Trip',
  format: 'square-8',
  coverType: 'softcover',
  theme: 'classic',
  spreads: [{ id: 's1', layout: 'two-up', slots: [], caption: '' }],
  photos: [],
};

function Tray() {
  const [draft, dispatch] = useReducer(editorReducer, emptyDraft);
  const uploads = useTrayUploads(dispatch);
  return (
    <PhotoTray
      draft={draft}
      dispatch={dispatch}
      selectedPhotoId={null}
      onSelectPhoto={() => {}}
      onReAddPhoto={() => {}}
      uploads={uploads}
    />
  );
}

let nextId = 0;
const stub = createStubPhotoUploadClient({
  latencyMs: 0,
  createId: () => `photo-${(nextId += 1)}`,
  createObjectUrl: (file) => `blob:${file.name}`,
});

function renderTray(client: PhotoUploadClient = stub) {
  render(
    <PhotoUploadProvider client={client}>
      <Tray />
    </PhotoUploadProvider>,
  );
}

const jpeg = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('PhotoTray uploads', () => {
  it('adds uploaded photos with alt text from their file names', async () => {
    renderTray();
    await userEvent.upload(screen.getByLabelText('Add photos'), [jpeg('IMG_2041.jpg'), jpeg('lake-day.jpeg')]);
    const library = within(await screen.findByRole('list', { name: 'Photo library' }));
    expect(library.getByRole('img', { name: 'IMG 2041' })).toHaveAttribute('src', 'blob:IMG_2041.jpg');
    expect(library.getByRole('img', { name: 'lake day' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Photos (2)' })).toBeInTheDocument();
  });

  it('shows uploads in progress until they finish', async () => {
    const pending: Array<() => void> = [];
    const slow: PhotoUploadClient = {
      upload: (file) =>
        new Promise<UploadedPhoto>((resolve) => {
          pending.push(() => resolve({ id: file.name, url: `blob:${file.name}`, name: file.name }));
        }),
    };
    renderTray(slow);
    await userEvent.upload(screen.getByLabelText('Add photos'), [jpeg('a.jpg'), jpeg('b.jpg')]);
    expect(screen.getByText('Uploading 2 photos…')).toHaveAttribute('role', 'status');
    pending.forEach((finish) => finish());
    await waitFor(() => expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Photos (2)' })).toBeInTheDocument();
  });

  it('reports a failed upload as an alert that can be dismissed', async () => {
    renderTray();
    const notes = new File(['x'], 'notes.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText('Add photos'), notes, { applyAccept: false });
    const problems = await screen.findByRole('list', { name: 'Upload problems' });
    expect(within(screen.getByRole('alert')).getByText(/notes\.txt is not a supported image/)).toBeInTheDocument();
    await userEvent.click(within(problems).getByRole('button', { name: /^Dismiss: notes\.txt/ }));
    expect(screen.queryByRole('list', { name: 'Upload problems' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Photos (0)' })).toBeInTheDocument();
  });
});

describe('altFromFileName', () => {
  it('drops the extension and separators, and never returns an empty description', () => {
    expect(altFromFileName('IMG_2041.JPG')).toBe('IMG 2041');
    expect(altFromFileName('summer.lake-trip_01.png')).toBe('summer lake trip 01');
    expect(altFromFileName('.jpg')).toBe('Photo');
  });
});
