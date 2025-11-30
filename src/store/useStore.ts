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

export type AppState = {
  dbmlCode: string;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setDbmlCode: (code: string) => void;
  setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[]) => void;
  addStickyNote: () => void;
};

const initialDbml = `Table users {
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
    // Here we will trigger the parser later
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
}));
