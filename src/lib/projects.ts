import type { Edge, Node } from 'reactflow';

export type SavedProject = {
  id: string;
  name: string;
  dbmlCode: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt: number;
};

const STORAGE_KEY = 'opendb:projects';

export const newProjectId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function loadProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedProject[]) : [];
  } catch {
    return [];
  }
}

// Returns false if the browser refused the write (quota, private mode, etc.)
export function writeProjects(projects: SavedProject[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}
