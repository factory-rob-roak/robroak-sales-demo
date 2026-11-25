import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import type { Editor } from './Editor';
import { EditorLoadError } from './EditorLoadError';
import { EditorLoading } from './EditorLoading';

type EditorProps = ComponentProps<typeof Editor>;
type EditorModule = { default: ComponentType<EditorProps> };

// The editor is split into its own chunk so the project list does not download it.
// A failed chunk load (offline, or a deploy replaced the file) renders an error screen
// instead of crashing the app; React caches the result, so recovery needs a reload.
const LoadedEditor = lazy(() =>
  import('./Editor').then(
    (module): EditorModule => ({ default: module.Editor }),
    (): EditorModule => ({ default: EditorLoadError }),
  ),
);

export function LazyEditor(props: EditorProps) {
  return (
    <Suspense fallback={<EditorLoading />}>
      <LoadedEditor {...props} />
    </Suspense>
  );
}
