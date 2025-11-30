import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { MoreVertical, Key } from 'lucide-react';

interface Column {
  name: string;
  type: string;
  constraints: string;
}

interface TableNodeData {
  label: string;
  columns: Column[];
}

const TableNode = ({ data }: { data: TableNodeData }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg min-w-[200px] overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">{data.label}</span>
        <MoreVertical className="w-4 h-4 text-zinc-400" />
      </div>
      
      {/* Columns */}
      <div className="py-2">
        {data.columns.map((col: Column) => (
          <div key={col.name} className="relative px-3 py-1 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group">
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
