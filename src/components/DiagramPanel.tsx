import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Panel,
  ReactFlowProvider,
  PanOnScrollMode,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '@/store/useStore';
import TableNode from './nodes/TableNode';
import StickyNoteNode from './nodes/StickyNoteNode';
import { layoutTables, parseDbmlToFlow, LayoutDirection } from '@/lib/dbml';
import { LayoutGrid, Plus } from 'lucide-react';

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
  const { fitView } = useReactFlow();

  // Hover sobre tabla o relación, y relaciones seleccionadas: se resaltan
  // las aristas involucradas y las tablas en sus extremos.
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const { displayNodes, displayEdges } = useMemo(() => {
    const activeEdgeIds = new Set<string>();
    const activeNodeIds = new Set<string>();

    if (hoveredNodeId) activeNodeIds.add(hoveredNodeId);
    if (hoveredEdgeId) activeEdgeIds.add(hoveredEdgeId);
    edges.forEach((edge) => {
      if (edge.selected) activeEdgeIds.add(edge.id);
      if (hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) {
        activeEdgeIds.add(edge.id);
      }
    });
    edges.forEach((edge) => {
      if (activeEdgeIds.has(edge.id)) {
        activeNodeIds.add(edge.source);
        activeNodeIds.add(edge.target);
      }
    });

    if (activeEdgeIds.size === 0 && activeNodeIds.size === 0) {
      return { displayNodes: nodes, displayEdges: edges };
    }

    return {
      displayNodes: nodes.map((node) =>
        node.type === 'tableNode' && activeNodeIds.has(node.id)
          ? { ...node, data: { ...node.data, highlighted: true } }
          : node
      ),
      displayEdges: edges.map((edge) =>
        activeEdgeIds.has(edge.id)
          ? {
              ...edge,
              animated: false,
              style: { ...edge.style, stroke: '#3b82f6', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            }
          : edge
      ),
    };
  }, [hoveredNodeId, hoveredEdgeId, nodes, edges]);

  // Reorganiza las tablas con dagre según las relaciones actuales (notas intactas).
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('auto');
  const organizeTables = () => {
    setNodes((currentNodes) => {
      const tables = currentNodes.filter((n) => n.type === 'tableNode');
      const others = currentNodes.filter((n) => n.type !== 'tableNode');
      return [...layoutTables(tables, edges, layoutDirection), ...others];
    });
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  };

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
        // Keep table positions the user already moved (matched by id)
        const positions = new Map(currentNodes.map(n => [n.id, n.position]));
        const tables = newNodes.map(n =>
          positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n
        );
        const stickyNotes = currentNodes.filter(n => n.type === 'stickyNote');
        return [...tables, ...stickyNotes];
    });
    setEdges(newEdges);
  }, [dbmlCode, setNodes, setEdges]);

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-zinc-950">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeMouseEnter={(_, node) => {
          if (node.type === 'tableNode') setHoveredNodeId(node.id);
        }}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
      >
        <Background color="#999" gap={16} size={1} />
        <Controls />
        <MiniMap nodeColor={n => {
            if (n.type === 'tableNode') return '#3b82f6';
            if (n.type === 'stickyNote') return '#eab308';
            return '#eee';
        }} />
        <Panel position="top-right" className="flex gap-2">
          <select
            value={layoutDirection}
            onChange={(e) => setLayoutDirection(e.target.value as LayoutDirection)}
            title="Dirección de organización"
            className="bg-white dark:bg-zinc-800 px-2 py-2 rounded shadow-md border border-zinc-200 dark:border-zinc-700 text-sm"
          >
            <option value="auto">Automático</option>
            <option value="down">Hacia abajo</option>
            <option value="side">Hacia los lados</option>
          </select>
          <button
            onClick={organizeTables}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            <LayoutGrid className="w-4 h-4" />
            Organizar tablas
          </button>
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
