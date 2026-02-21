
import React from "react";
import { ScriptElementsSidebar } from "./ScriptElementsSidebar";

interface EditorSidebarProps {
  scriptId: string;
  activeTab: string;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ scriptId, activeTab }) => {
  return (
    <div className="space-y-6">
      <ScriptElementsSidebar scriptId={scriptId} />
    </div>
  );
};
