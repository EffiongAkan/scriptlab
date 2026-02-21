
import React, { createContext, useContext, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

type ScriptElement = {
  id: string;
  type: "heading" | "action" | "character" | "dialogue" | "parenthetical" | "transition";
  content: string;
};

interface ScriptEditorContextType {
  insertScriptElement: (type: ScriptElement["type"], content?: string) => void;
  currentElement: ScriptElement | null;
  resetCurrentElement: () => void;
  focusedElementId: string | null;
  setFocusedElementId: (id: string | null) => void;
}

const ScriptEditorContext = createContext<ScriptEditorContextType | undefined>(undefined);

export function ScriptEditorProvider({ children }: { children: React.ReactNode }) {
  const [currentElement, setCurrentElement] = useState<ScriptElement | null>(null);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  const insertScriptElement = (type: ScriptElement["type"], content?: string) => {
    const defaultContent = {
      heading: "INT. LOCATION - TIME",
      action: "",
      character: "CHARACTER NAME",
      dialogue: "Character's dialogue goes here...",
      parenthetical: "(action or tone)",
      transition: "CUT TO:",
    }[type];

    // Use proper UUID generation instead of timestamp-based IDs
    setCurrentElement({
      id: uuidv4(),
      type,
      content: content || defaultContent
    });
  };

  const resetCurrentElement = () => {
    setCurrentElement(null);
  };

  return (
    <ScriptEditorContext.Provider value={{
      insertScriptElement,
      currentElement,
      resetCurrentElement,
      focusedElementId,
      setFocusedElementId
    }}>
      {children}
    </ScriptEditorContext.Provider>
  );
}

export function useScriptEditor() {
  const context = useContext(ScriptEditorContext);
  if (context === undefined) {
    throw new Error("useScriptEditor must be used within a ScriptEditorProvider");
  }
  return context;
}
