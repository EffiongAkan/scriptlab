
import React, { createContext, useContext, useReducer, useCallback } from "react";
import { ScriptElementType } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";

interface HistoryState {
  past: ScriptElementType[][];
  present: ScriptElementType[];
  future: ScriptElementType[][];
  lastActionType: 'PUSH' | 'UNDO' | 'REDO' | 'INIT' | null;
  revision: number; // Increment on every state change
}

type HistoryAction =
  | { type: "PUSH"; elements: ScriptElementType[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "INIT"; elements: ScriptElementType[] };

const ScriptHistoryContext = createContext<{
  canUndo: boolean;
  canRedo: boolean;
  elements: ScriptElementType[];
  lastActionType: 'PUSH' | 'UNDO' | 'REDO' | 'INIT' | null;
  revision: number;
  pushState: (elements: ScriptElementType[]) => void;
  undo: () => void;
  redo: () => void;
  initState: (elements: ScriptElementType[]) => void;
} | null>(null);

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  console.log("History Action:", action.type, "Current Revision:", state.revision);
  switch (action.type) {
    case "INIT":
      return {
        past: [],
        present: action.elements ? [...action.elements] : [],
        future: [],
        lastActionType: 'INIT',
        revision: state.revision + 1,
      };
    case "PUSH":
      if (!action.elements || action.elements.length === 0) {
        return state;
      }
      try {
        if (JSON.stringify(state.present) === JSON.stringify(action.elements)) {
          return state;
        }
      } catch (error) {
        // fall through
      }
      console.log("Pushing new state to history. Past length:", state.past.length);
      return {
        past: [...state.past, state.present ? [...state.present] : []],
        present: [...action.elements],
        future: [],
        lastActionType: 'PUSH',
        revision: state.revision + 1,
      };
    case "UNDO": {
      if (state.past.length === 0) {
        console.log("Nothing to undo");
        return state;
      }
      const lastPastState = state.past[state.past.length - 1];
      console.log("Undoing. New present length:", lastPastState.length);
      return {
        past: state.past.slice(0, -1),
        present: lastPastState ? [...lastPastState] : [],
        future: [state.present ? [...state.present] : [], ...state.future],
        lastActionType: 'UNDO',
        revision: state.revision + 1,
      };
    }
    case "REDO": {
      if (state.future.length === 0) {
        console.log("Nothing to redo");
        return state;
      }
      const nextFutureState = state.future[0];
      console.log("Redoing. New present length:", nextFutureState.length);
      return {
        past: [...state.past, state.present ? [...state.present] : []],
        present: nextFutureState ? [...nextFutureState] : [],
        future: state.future.slice(1),
        lastActionType: 'REDO',
        revision: state.revision + 1,
      };
    }
    default:
      return state;
  }
}

export function ScriptHistoryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(historyReducer, {
    past: [],
    present: [],
    future: [],
    lastActionType: null,
    revision: 0,
  });
  const { toast } = useToast();

  const pushState = React.useCallback((elements: ScriptElementType[]) => {
    if (elements) {
      dispatch({ type: "PUSH", elements });
    } else {
      console.warn("Attempted to push undefined elements to history");
    }
  }, []);

  const initState = React.useCallback((elements: ScriptElementType[]) => {
    if (elements) {
      dispatch({ type: "INIT", elements });
    } else {
      console.warn("Attempted to initialize history with undefined elements");
      dispatch({ type: "INIT", elements: [] });
    }
  }, []);

  const undo = React.useCallback(() => {
    dispatch({ type: "UNDO" });
    // Toast already handled here (and in shortcuts hook - might duplicate but that's fine for now)
  }, []);

  const redo = React.useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  return (
    <ScriptHistoryContext.Provider value={{
      elements: state.present || [],
      lastActionType: state.lastActionType,
      revision: state.revision,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      pushState,
      undo,
      redo,
      initState,
    }}>
      {children}
    </ScriptHistoryContext.Provider>
  );
}

export function useScriptHistory() {
  const context = useContext(ScriptHistoryContext);
  if (!context) {
    throw new Error("useScriptHistory must be used within ScriptHistoryProvider");
  }
  return context;
}
