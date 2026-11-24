import type { Project } from '../types';

export const sampleProjects: Project[] = [
  {
    id: 'p1',
    title: 'Summer in Maine',
    format: 'landscape-11',
    pageCount: 24,
    coverType: 'hardcover',
    updatedAt: '2026-11-01T12:00:00Z',
  },
  {
    id: 'p2',
    title: "Ava's First Year",
    format: 'square-8',
    pageCount: 40,
    coverType: 'layflat',
    updatedAt: '2026-10-18T09:30:00Z',
  },
  {
    id: 'p3',
    title: 'Family Recipes',
    format: 'portrait-8x11',
    pageCount: 20,
    coverType: 'softcover',
    updatedAt: '2026-09-02T16:45:00Z',
  },
];
