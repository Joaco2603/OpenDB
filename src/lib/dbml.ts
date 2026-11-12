import { Node, Edge, MarkerType } from 'reactflow';
import dagre from 'dagre';
import { Parser } from '@dbml/core';

const nodeWidth = 220;

interface Column {
  name: string;
  type: string;
  constraints: string;
  note?: string;
}

interface Table {
  name: string;
  note?: string;
  indexes: string[];
  columns: Column[];
}

// Tipo de columna: @dbml/core lo entrega como objeto { type_name, args }.
const typeName = (type: unknown): string => {
  if (typeof type === 'string') return type;
  if (type && typeof type === 'object' && 'type_name' in type) {
    return String((type as { type_name: unknown }).type_name);
  }
  return '';
};

// Restricciones como texto (TableNode busca 'primary key' dentro).
const constraintsOf = (field: {
  pk?: boolean;
  unique?: boolean;
  not_null?: boolean;
  increment?: boolean;
}): string => {
  const parts: string[] = [];
  if (field.pk) parts.push('primary key');
  if (field.unique) parts.push('unique');
  if (field.not_null) parts.push('not null');
  if (field.increment) parts.push('increment');
  return parts.join(', ');
};

export const parseDbmlToFlow = (dbml: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const tables: Table[] = [];

  // Un DBML a medio escribir no debe tumbar la app: sin diagrama hasta que compile.
  let database;
  try {
    database = Parser.parse(dbml, 'dbml').export();
  } catch (error) {
    console.warn('DBML inválido:', error);
    return { nodes: [] as Node[], edges: [] as Edge[] };
  }

  database.schemas.forEach((schema) => {
    schema.tables.forEach((table) => {
      const columns: Column[] = table.fields.map((field) => ({
        name: field.name,
        type: typeName(field.type),
        constraints: constraintsOf(field),
        note: field.note || undefined,
      }));
      const indexes: string[] = (table.indexes ?? []).map((idx) => {
        const cols = (idx.columns ?? []).map((c: { value: unknown }) => String(c.value)).join(', ');
        return `(${cols})${idx.unique ? ' unique' : ''}`;
      });
      tables.push({ name: table.name, note: table.note || undefined, indexes, columns });
    });
  });

  tables.forEach((table) => {
    nodes.push({
      id: table.name,
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: { label: table.name, note: table.note, indexes: table.indexes, columns: table.columns },
    });
  });

  // Refs: inline (ref: > tabla.col) y de nivel superior (Ref: a.b > c.d).
  // La flecha va del lado "muchos" (*) al lado "uno"; sin relación, del primero al segundo.
  database.schemas.forEach((schema) => {
    schema.refs.forEach((ref) => {
      if (ref.endpoints.length < 2) return;
      const [first, second] = ref.endpoints;
      const source = first.relation === '1' && second.relation === '*' ? second : first;
      const target = source === first ? second : first;
      const sourceHandle = source.fieldNames[0];
      const targetHandle = target.fieldNames[0];

      edges.push({
        id: `e-${source.tableName}-${target.tableName}-${sourceHandle}-${targetHandle}`,
        source: source.tableName,
        target: target.tableName,
        sourceHandle,
        targetHandle,
        animated: true,
        style: { stroke: '#b1b1b7' },
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    });
  });

  return { nodes: layoutTables(nodes, edges), edges };
};

// Altura estimada de una tabla: header + filas de columnas.
const tableHeight = (columnCount: number) => 50 + columnCount * 30;

export type LayoutDirection = 'auto' | 'down' | 'side';

// Dagre con una dirección fija: 'down' = de arriba hacia abajo, 'side' = de izquierda a derecha.
const runDagre = (nodes: Node[], edges: Edge[], rankdir: 'TB' | 'LR') => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: tableHeight(node.data.columns.length) });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);
  return g;
};

// Auto layout con dagre. Solo posiciona nodos de tabla; el resto (notas) no se toca.
// 'auto' prueba ambas direcciones y se queda con la que da una forma más cercana a una pantalla (16:10).
export const layoutTables = (
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'auto'
): Node[] => {
  const TARGET_RATIO = 16 / 10;
  const down = runDagre(nodes, edges, 'TB');
  const side = runDagre(nodes, edges, 'LR');

  const ratioDistance = (g: dagre.graphlib.Graph) => {
    const { width = 1, height = 1 } = g.graph();
    const ratio = width / height;
    return Math.abs(Math.log(ratio / TARGET_RATIO));
  };

  const g =
    direction === 'down' ? down :
    direction === 'side' ? side :
    ratioDistance(down) <= ratioDistance(side) ? down : side;

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - tableHeight(node.data.columns.length) / 2,
      },
    };
  });
};
