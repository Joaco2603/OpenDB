import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { SavedProject, loadProjects, newProjectId, writeProjects } from '@/lib/projects';
import { parseDbmlToFlow } from '@/lib/dbml';

export type AppState = {
  dbmlCode: string;
  nodes: Node[];
  edges: Edge[];
  projects: SavedProject[];
  currentProjectId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setDbmlCode: (code: string) => void;
  setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[]) => void;
  addStickyNote: () => void;
  saveProject: (name?: string) => boolean;
  renameProject: (id: string, name: string) => boolean;
  openProject: (id: string) => void;
  deleteProject: (id: string) => boolean;
  newProject: () => void;
};

export const initialDbml = `Table users {
  id integer [primary key]
  username varchar
  email varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text
  user_id integer
}

Ref: posts.user_id > users.id
`;

export const useStore = create<AppState>((set, get) => ({
  dbmlCode: initialDbml,
  nodes: [],
  edges: [],
  projects: loadProjects(),
  currentProjectId: null,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setDbmlCode: (code: string) => {
    set({ dbmlCode: code });
  },
  setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => {
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes
    }));
  },
  setEdges: (edges: Edge[]) => set({ edges }),
  addStickyNote: () => {
    const id = `note-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'stickyNote',
      position: { x: 100, y: 100 },
      data: { label: 'New Note' },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  // Saves the current diagram. If it is already a saved project, overwrites it.
  // If it is new, `name` is required and creates the project.
  saveProject: (name?: string) => {
    const { currentProjectId, projects, dbmlCode, nodes, edges } = get();
    const current = projects.find((p) => p.id === currentProjectId);
    const finalName = (current ? current.name : (name ?? '')).trim();
    if (!finalName) return false;

    const id = current ? current.id : newProjectId();
    const project: SavedProject = {
      id,
      name: finalName,
      dbmlCode,
      nodes,
      edges,
      updatedAt: Date.now(),
    };
    const next = current
      ? projects.map((p) => (p.id === id ? project : p))
      : [project, ...projects];

    if (!writeProjects(next)) return false;
    set({ projects: next, currentProjectId: id });
    return true;
  },

  renameProject: (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const next = get().projects.map((p) =>
      p.id === id ? { ...p, name: trimmed } : p
    );
    if (!writeProjects(next)) return false;
    set({ projects: next });
    return true;
  },

  openProject: (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    set({
      currentProjectId: id,
      dbmlCode: project.dbmlCode,
      nodes: project.nodes,
      edges: project.edges,
    });
  },

  deleteProject: (id: string) => {
    const { projects, currentProjectId } = get();
    const next = projects.filter((p) => p.id !== id);
    if (!writeProjects(next)) return false;
    set({
      projects: next,
      currentProjectId: currentProjectId === id ? null : currentProjectId,
    });
    return true;
  },

  newProject: () => {
    const { nodes, edges } = parseDbmlToFlow(initialDbml);
    set({
      currentProjectId: null,
      dbmlCode: initialDbml,
      nodes,
      edges,
    });
  },
}));
