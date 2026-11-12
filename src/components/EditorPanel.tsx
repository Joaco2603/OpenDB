import React from 'react';
import Editor from '@monaco-editor/react';
import { PanelLeftClose } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function EditorPanel({ onClose }: { onClose?: () => void }) {
  const { dbmlCode, setDbmlCode } = useStore();

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      <div className="h-10 bg-[#2d2d2d] flex items-center gap-2 px-4 border-b border-[#3e3e3e]">
        <span className="text-sm text-gray-300 font-medium flex-1">schema.dbml</span>
        {onClose && (
          <button
            onClick={onClose}
            title="Ocultar schema.dbml"
            aria-label="Ocultar schema.dbml"
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#3e3e3e] transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="sql" // Monaco doesn't have built-in DBML, SQL is close enough for highlighting
          value={dbmlCode}
          onChange={(value) => setDbmlCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
