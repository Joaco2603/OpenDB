import { Node, Edge, MarkerType } from 'reactflow';
import dagre from 'dagre';

const nodeWidth = 220;

interface Column {
  name: string;
  type: string;
  constraints: string;
}

interface Table {
  name: string;
  columns: Column[];
}

export const parseDbmlToFlow = (dbml: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const tables: Table[] = [];

  // Simple Regex Parser for Tables
  // Matches: Table Name { body }
  const tableRegex = /Table\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  // We need to reset lastIndex if we reuse regex, but here we create new one or use exec loop
  // Note: exec loop updates lastIndex automatically
  
  // Clone dbml to avoid issues? No, string is immutable.
  
  while ((match = tableRegex.exec(dbml)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns = body.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('Note:')); // Basic filtering
    
    const parsedColumns = columns.map(col => {
      // Simple split by space, but handle constraints like [pk]
      // Example: id integer [primary key]
      const parts = col.split(/\s+/);
      if (parts.length < 2) return null; // Skip invalid lines

      const name = parts[0];
      const type = parts[1];
      // Join the rest as constraints
      const constraints = col.substring(col.indexOf('[') + 1, col.indexOf(']')) || '';
      
      return { name, type, constraints };
    }).filter((col): col is Column => col !== null);

    tables.push({ name: tableName, columns: parsedColumns });
  }

  // Create Nodes
  tables.forEach((table) => {
    nodes.push({
      id: table.name,
      type: 'tableNode', 
      position: { x: 0, y: 0 },
      data: { label: table.name, columns: table.columns },
    });
  });

  // Simple Regex Parser for Refs
  // Ref: posts.user_id > users.id
  // Ref: posts.user_id - users.id
  // Ref: posts.user_id < users.id
  const refRegex = /Ref:\s*(\w+)\.(\w+)\s*([<>]-?|[-])\s*(\w+)\.(\w+)/g;
  while ((match = refRegex.exec(dbml)) !== null) {
    const sourceTable = match[1];
    const sourceCol = match[2];
    const op = match[3];
    const targetTable = match[4];
    const targetCol = match[5];

    // Determine direction
    // > : source -> target
    // < : target -> source
    // - : source - target (undirected or bidirectional)
    
    let source = sourceTable;
    let target = targetTable;
    let sourceHandle = sourceCol;
    let targetHandle = targetCol;
    
    if (op.includes('<')) {
        source = targetTable;
        target = sourceTable;
        sourceHandle = targetCol;
        targetHandle = sourceCol;
    }

    edges.push({
      id: `e-${source}-${target}-${sourceHandle}-${targetHandle}`,
      source: source,
      target: target,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      animated: true,
      style: { stroke: '#b1b1b7' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });
  }

  // Auto Layout with Dagre
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR' });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    // Estimate height: Header (40) + Columns (28 * count) + Padding
    const height = 50 + (node.data.columns.length * 30);
    g.setNode(node.id, { width: nodeWidth, height: height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - (50 + (node.data.columns.length * 30)) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
