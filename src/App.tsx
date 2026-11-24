import { useState } from 'react';
import styles from './App.module.css';
import { ProjectCard } from './components/ProjectCard';
import { sampleProjects } from './data/sampleProjects';

export function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const openProject = sampleProjects.find((project) => project.id === openProjectId);

  return (
    <main className={styles.page}>
      <h1>Your photo books</h1>
      <section className={styles.grid} aria-label="Projects">
        {sampleProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={setOpenProjectId} />
        ))}
      </section>
      {openProject && (
        <p role="status" className={styles.notice}>
          The editor for “{openProject.title}” is not built yet. See prototype/photo-book-editor for
          the design.
        </p>
      )}
    </main>
  );
}
