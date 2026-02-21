
import React from "react";
import { useParams } from "react-router-dom";
import { ScriptEditorProvider } from "@/contexts/ScriptEditorContext";
import { ScriptHistoryProvider } from "@/contexts/ScriptHistoryContext";
import { CollaborationProvider } from "@/contexts/CollaborationContext";
import { EditorContent } from "@/components/script-editor/EditorContent";
import { ErrorBoundary } from "@/components/script-editor/ErrorBoundary";

export default function ScriptEditor() {
  const { scriptId } = useParams<{ scriptId: string }>();

  // Validate scriptId before proceeding
  if (!scriptId || scriptId === ':scriptId') {
    console.error('Invalid or missing scriptId:', scriptId);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Script</h2>
          <p className="text-muted-foreground">The script ID is missing or invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ScriptHistoryProvider>
        <ScriptEditorProvider>
          <CollaborationProvider scriptId={scriptId}>
            <EditorContent />
          </CollaborationProvider>
        </ScriptEditorProvider>
      </ScriptHistoryProvider>
    </ErrorBoundary>
  );
}
