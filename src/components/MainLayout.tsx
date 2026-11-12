"use client";

import { useRef, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import EditorPanel from "./EditorPanel";
import DiagramPanel from "./DiagramPanel";
import ProjectBar from "./ProjectBar";

// Since we haven't created the UI components for resizable panels yet (shadcn/ui style),
// I will use the raw react-resizable-panels components for now or create a wrapper.
// Actually, let's use the raw components directly from the library to avoid dependency on shadcn for now,
// or I can quickly create the wrapper if I want to be fancy.
// Let's stick to raw library for simplicity in this step.

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";

export default function MainLayout() {
  const editorRef = useRef<ImperativePanelHandle>(null);
  const [editorOpen, setEditorOpen] = useState(true);

  const toggleEditor = (open: boolean) => {
    if (open) editorRef.current?.expand();
    else editorRef.current?.collapse();
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <ProjectBar />
      <div className="relative flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel
            ref={editorRef}
            defaultSize={40}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setEditorOpen(false)}
            onExpand={() => setEditorOpen(true)}
          >
            <EditorPanel onClose={() => toggleEditor(false)} />
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors cursor-col-resize" />
          <Panel defaultSize={60} minSize={20}>
            <DiagramPanel />
          </Panel>
        </PanelGroup>

        {!editorOpen && (
          <button
            onClick={() => toggleEditor(true)}
            title="Mostrar schema.dbml"
            aria-label="Mostrar schema.dbml"
            className="absolute left-2 top-2 z-10 p-1.5 rounded bg-[#2d2d2d] text-zinc-200 hover:bg-[#3e3e3e] border border-[#3e3e3e] shadow"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
