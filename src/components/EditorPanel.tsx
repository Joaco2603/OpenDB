import React from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '@/store/useStore';

export default function EditorPanel() {
  const { dbmlCode, setDbmlCode } = useStore();

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-[#3e3e3e]">
        <span className="text-sm text-gray-300 font-medium">schema.dbml</span>
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
