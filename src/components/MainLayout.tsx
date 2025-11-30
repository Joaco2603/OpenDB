"use client";

import EditorPanel from "./EditorPanel";
import DiagramPanel from "./DiagramPanel";

// Since we haven't created the UI components for resizable panels yet (shadcn/ui style),
// I will use the raw react-resizable-panels components for now or create a wrapper.
// Actually, let's use the raw components directly from the library to avoid dependency on shadcn for now,
// or I can quickly create the wrapper if I want to be fancy.
// Let's stick to raw library for simplicity in this step.

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function MainLayout() {
  return (
    <div className="h-screen w-screen flex flex-col">
        
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={20}>
            <EditorPanel />
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors cursor-col-resize" />
          <Panel defaultSize={60} minSize={20}>
            <DiagramPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
