import { formatCents } from '../lib/money';
import { priceBook } from '../lib/pricing';
import { COVER_LABELS, FORMAT_LABELS, type Project } from '../types';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onOpen: (projectId: string) => void;
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <article className={styles.card} aria-labelledby={`project-${project.id}-title`}>
      <h2 id={`project-${project.id}-title`} className={styles.title}>
        {project.title}
      </h2>
      <p className={styles.meta}>
        {FORMAT_LABELS[project.format]} · {COVER_LABELS[project.coverType]} · {project.pageCount}{' '}
        pages
      </p>
      <p className={styles.price}>{formatCents(priceBook(project))}</p>
      <button type="button" className={styles.open} onClick={() => onOpen(project.id)}>
        Open {project.title}
      </button>
    </article>
  );
}
