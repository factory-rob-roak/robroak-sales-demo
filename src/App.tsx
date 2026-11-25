import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import { ProjectCard } from './components/ProjectCard';
import { sampleProjects } from './data/sampleProjects';
import { LazyEditor } from './features/editor/LazyEditor';

export function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [returnedFromEditor, setReturnedFromEditor] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openProject = sampleProjects.find((project) => project.id === openProjectId);

  useEffect(() => {
    if (returnedFromEditor && !openProject) headingRef.current?.focus();
  }, [returnedFromEditor, openProject]);

  if (openProject) {
    return (
      <LazyEditor
        key={openProject.id}
        project={openProject}
        onClose={() => {
          setOpenProjectId(null);
          setReturnedFromEditor(true);
        }}
      />
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
