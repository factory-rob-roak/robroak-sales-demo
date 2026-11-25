import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import { ProjectCard } from './components/ProjectCard';
import { sampleProjects } from './data/sampleProjects';
import { Editor } from './features/editor/Editor';
import { EditorErrorBoundary } from './features/editor/EditorErrorBoundary';

export function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [returnedFromEditor, setReturnedFromEditor] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openProject = sampleProjects.find((project) => project.id === openProjectId);

  useEffect(() => {
    if (returnedFromEditor && !openProject) headingRef.current?.focus();
  }, [returnedFromEditor, openProject]);

  if (openProject) {
    const closeEditor = () => {
      setOpenProjectId(null);
      setReturnedFromEditor(true);
    };
    return (
      <EditorErrorBoundary key={openProject.id} onClose={closeEditor}>
        <Editor project={openProject} onClose={closeEditor} />
      </EditorErrorBoundary>
    );
  }

  return (
    <main className={styles.page}>
      <h1 ref={headingRef} tabIndex={-1}>
        Your photo books
      </h1>
      <section className={styles.grid} aria-label="Projects">
        {sampleProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={setOpenProjectId} />
        ))}
      </section>
    </main>
  );
}
