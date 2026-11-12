import React, { memo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from 'reactflow';
import { BookOpen, AppWindow, Key } from 'lucide-react';

interface Column {
  name: string;
  type: string;
  constraints: string;
  note?: string;
}

interface TableNodeData {
  label: string;
  note?: string;
  indexes?: string[];
  columns: Column[];
  highlighted?: boolean;
}

const TableNode = ({ data }: { data: TableNodeData }) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const hasInfo = !!data.note || !!data.indexes?.length;

  const show = () => {
    const r = headerRef.current?.getBoundingClientRect();
    if (r) setPos({ x: r.right + 12, y: r.top });
  };

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border-2 rounded-lg shadow-lg min-w-[200px] overflow-hidden transition-colors ${
        data.highlighted
          ? 'border-blue-500 ring-2 ring-blue-400/50'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      {/* Header */}
      <div
        ref={headerRef}
        onMouseEnter={hasInfo ? show : undefined}
        onMouseLeave={() => setPos(null)}
        className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center"
      >
        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">{data.label}</span>
        {hasInfo && <BookOpen className="w-4 h-4 text-zinc-400" />}
      </div>
      {pos &&
        createPortal(
          <div
            style={{ left: pos.x, top: pos.y }}
            className="fixed z-50 w-80 max-w-[90vw] pointer-events-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              <AppWindow className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{data.label}</span>
            </div>
            {data.note && (
              <div className="px-4 py-3">
                <div className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Note</div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{data.note}</p>
              </div>
            )}
            {!!data.indexes?.length && (
              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
                <div className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Indexes</div>
                <ul className="list-disc pl-5 text-sm text-orange-700 dark:text-orange-400">
                  {data.indexes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>,
          document.body
        )}
      
      {/* Columns */}
      <div className="py-2">
        {data.columns.map((col: Column) => (
          <div key={col.name} title={col.note} className="relative px-3 py-1 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group">
            {/* Left Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id={col.name}
              className="w-2 h-2 !bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: -5 }}
            />
            
            <div className="flex items-center gap-2">
               {col.constraints.includes('primary key') && <Key className="w-3 h-3 text-yellow-500" />}
               <span className={`text-xs font-medium ${col.constraints.includes('primary key') ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                 {col.name}
               </span>
            </div>
            <span className="text-xs text-zinc-400 ml-4">{col.type}</span>

            {/* Right Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id={col.name}
              className="w-2 h-2 !bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ right: -5 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TableNode);
