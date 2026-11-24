import type { Project } from '../../../types';
import { createDefaultDraft } from '../constants';
import { createDraftStorage, STORAGE_KEY, type DraftStorage } from '../storage';

/**
 * Local storage for one project's draft. A project with no usable saved draft
 * opens as the default new book, named and sized after the project.
 */
export function createProjectDraftStorage(
  project: Project,
  storage: DraftStorage = createDraftStorage({ key: `${STORAGE_KEY}:${project.id}` }),
): DraftStorage {
  return {
    load() {
      const result = storage.load();
      if (result.status === 'loaded') return result;
      const { title, format, coverType } = project;
      return { status: 'loaded', draft: { ...createDefaultDraft(), title, format, coverType } };
    },
    save: (draft) => storage.save(draft),
  };
}
