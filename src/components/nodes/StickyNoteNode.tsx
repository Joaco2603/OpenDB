import React, { memo } from 'react';
import { NodeResizer } from 'reactflow';

interface StickyNoteData {
  label: string;
}

const StickyNoteNode = ({ data, selected }: { data: StickyNoteData, selected: boolean }) => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineClassName="border-yellow-400" handleClassName="h-3 w-3 bg-yellow-400 border-2 rounded border-white" />
      <div className="h-full w-full bg-yellow-200 dark:bg-yellow-900/80 border border-yellow-300 dark:border-yellow-700 rounded shadow-sm p-4 flex flex-col">
        <textarea
          className="w-full h-full bg-transparent resize-none focus:outline-none text-sm text-yellow-900 dark:text-yellow-100 placeholder-yellow-800/50 font-sans"
          placeholder="Add a note..."
          defaultValue={data.label}
          onKeyDown={(e) => e.stopPropagation()} // Prevent React Flow from catching key events
        />
      </div>
    </>
  );
};

export default memo(StickyNoteNode);
