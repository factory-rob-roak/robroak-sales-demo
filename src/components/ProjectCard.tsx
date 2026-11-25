import { useI18n } from '../i18n/useI18n';
import { priceBook } from '../lib/pricing';
import type { Project } from '../types';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onOpen: (projectId: string) => void;
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const { t, formatCents, formatDate } = useI18n();
  return (
    <article className={styles.card} aria-labelledby={`project-${project.id}-title`}>
      <h2 id={`project-${project.id}-title`} className={styles.title}>
        {project.title}
      </h2>
      <p className={styles.meta}>
        {t.formats[project.format]} · {t.covers[project.coverType]} · {t.projects.pageCount(project.pageCount)}
      </p>
      <p className={styles.meta}>
        <time dateTime={project.updatedAt}>{t.projects.edited(formatDate(project.updatedAt))}</time>
      </p>
      <p className={styles.price}>{formatCents(priceBook(project))}</p>
      <button type="button" className={styles.open} onClick={() => onOpen(project.id)}>
        {t.projects.open(project.title)}
      </button>
    </article>
  );
}
