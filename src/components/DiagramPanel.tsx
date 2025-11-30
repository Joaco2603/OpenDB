import React, { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '@/store/useStore';
import TableNode from './nodes/TableNode';
import StickyNoteNode from './nodes/StickyNoteNode';
import { parseDbmlToFlow } from '@/lib/dbml';
import { Plus } from 'lucide-react';

const nodeTypes = {
  tableNode: TableNode,
  stickyNote: StickyNoteNode,
};

function DiagramFlow() {
  const {
    dbmlCode,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    addStickyNote,
  } = useStore();

  // Parse DBML when code changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = parseDbmlToFlow(dbmlCode);
    
    // Merge with existing sticky notes
    // We need to preserve sticky notes which are not generated from DBML
    // We access the current nodes from the store state directly inside the effect if needed, 
    // but here we rely on the fact that 'nodes' from useStore might be stale if we don't include it in deps,
    // but including it causes loops.
    // Better approach: pass a function to setNodes or read from store getter if possible.
    // Since we can't easily access get() here without subscribing, we'll trust that 
    // we only want to keep sticky notes that are currently in the state.
    // However, 'nodes' in the dependency array will cause infinite loop because setNodes updates it.
    // We need to decouple the "DBML nodes" from "Sticky Notes".
    // For this simple version, we will just filter the *current* nodes prop.
    // But wait, 'nodes' changes every time we setNodes.
    // We should only run this effect when dbmlCode changes.
    
    setNodes((currentNodes) => {
        const stickyNotes = currentNodes.filter(n => n.type === 'stickyNote');
        return [...newNodes, ...stickyNotes];
    });
    setEdges(newEdges);
  }, [dbmlCode, setNodes, setEdges]);

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
      >
        <Background color="#999" gap={16} size={1} />
        <Controls />
        <MiniMap nodeColor={n => {
            if (n.type === 'tableNode') return '#3b82f6';
            if (n.type === 'stickyNote') return '#eab308';
            return '#eee';
        }} />
        <Panel position="top-right">
          <button
            onClick={addStickyNote}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function DiagramPanel() {
  return (
    <ReactFlowProvider>
      <DiagramFlow />
    </ReactFlowProvider>
  );
}
