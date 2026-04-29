import { useRef, useEffect, useState, useCallback } from "react";
import { ScriptElementType } from "@/hooks/useScriptContent";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { useScriptHistory } from "@/contexts/ScriptHistoryContext";
import { useLocalElementState } from "@/hooks/useLocalElementState";
import { useScriptElementSync } from "@/hooks/useScriptElementSync";
import { useCollaborativeCursor } from "@/hooks/useCollaborativeCursor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function findNearestScriptElementId(node: HTMLElement | null): string | null {
  // Traverse up DOM tree to find a parent with a data-element-id attribute
  while (node) {
    if (node.id && node.id.startsWith('script-element-')) {
      return node.id.replace('script-element-', '');
    }
    if (node.dataset && node.dataset.elementId) {
      return node.dataset.elementId;
    }
    node = node.parentElement;
  }
  return null;
}

export const useScriptContentState = (
  scriptId: string,
  initialElements: ScriptElementType[],
  onContentChange?: () => void
) => {
  const { currentElement, resetCurrentElement, focusedElementId, setFocusedElementId } = useScriptEditor();
  const processedElementRef = useRef<string | null>(null);
  const { pushState, initState, elements: historyElements, lastActionType, revision } = useScriptHistory();
  const { toast } = useToast();
  const {
    localElements,
    realtimeElements, // Now coming from inside useLocalElementState
    useLocalElements,
    updateLocalElement,
    changeLocalElementType,
    deleteLocalElement,
    deleteLocalElements,
    addLocalElement,
    setAllElements,
    blockRealtimeSync
  } = useLocalElementState(scriptId, initialElements);
  const { syncElementToSupabase, syncMultipleElementsToSupabase, reorderElementsAtomic } = useScriptElementSync(scriptId, onContentChange);
  const { handleFocus, updateSelectionPosition, paperRef } = useCollaborativeCursor();

  // Initialize history with loaded elements
  // Initialize history with loaded elements
  useEffect(() => {
    // Only initialize if history is empty and we have valid elements
    // This prevents re-initializing (and wiping history) when we receive updates from undo/redo via props
    if (initialElements && initialElements.length > 0) {
      // Use a check to prevent overwriting existing history if we already have it
      // This is a bit of a heuristic but necessary given the architecture
      if (historyElements.length === 0) {
        initState(initialElements);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initState]); // Removed initialElements from deps to prevent re-run on every update

  // Sync local state with history when history changes (Undo/Redo)
  useEffect(() => {
    // Only update if historyElements exists
    if (historyElements && historyElements.length > 0) {
      // Check if different to avoid unnecessary updates
      const isDifferent = JSON.stringify(historyElements) !== JSON.stringify(localElements);

      // CRITICAL FIX: Only sync from history to local state if the last action was UNDO or REDO.
      // If it was PUSH, it means the history update came from us (the user typing), so we shouldn't
      // overwrite the local state (which might be ahead of the debounced history).
      if (isDifferent && (lastActionType === 'UNDO' || lastActionType === 'REDO')) {
        console.log(`Syncing local state with history (${lastActionType})`);
        setAllElements(historyElements);

        // Re-enabled for Undo/Redo to ensure persistence and collaboration
        // We sync these changes to the DB so other users (and our own realtime stream) catch up.
        console.log(`Persisting ${lastActionType} state to database...`);
        // Re-enabled for Undo/Redo to ensure persistence and collaboration
        // We sync these changes to the DB so other users (and our own realtime stream) catch up.
        console.log(`Persisting ${lastActionType} state to database...`);
        syncMultipleElementsToSupabase(historyElements);

        if (onContentChange) onContentChange();
      }
    }
    // CRITICAL: Do NOT include localElements or syncElementToSupabase in dependency array!
    // syncElementToSupabase is a stable function and shouldn't trigger re-runs
    // If we do, every time the user types, this effect runs.
    // Since historyElements is "behind" (debounced), it would revert the user's typing immediately.
    // We only want to run this when historyElements changes (Undo/Redo/Push).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyElements, setAllElements, lastActionType]);

  // Monitor significant element changes and update history (debounced to prevent cursor jumping)
  useEffect(() => {
    const elementsToUse = useLocalElements ? localElements : realtimeElements;
    if (!elementsToUse || elementsToUse.length === 0) return;

    // Debounce history updates to prevent excessive re-renders during typing
    // Only push to history after user stops making changes for 1.5 seconds
    const timeoutId = setTimeout(() => {
      pushState(elementsToUse);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [useLocalElements, localElements, realtimeElements, pushState]);

  // Process current element insertion (use focus or selection position, always insert below)
  useEffect(() => {
    if (currentElement && currentElement.id !== processedElementRef.current) {
      const elementsArray = useLocalElements ? localElements : realtimeElements || [];
      let insertIndex = elementsArray.length; // Default to end

      // Prioritize the explicitly focused element from context
      if (focusedElementId) {
        const idx = elementsArray.findIndex(e => e.id === focusedElementId);
        if (idx >= 0) {
          insertIndex = idx + 1;
        }
      } else if (typeof window !== "undefined") {
        // Fallback to DOM selection if context focus is missing (rare)
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          let node = range.startContainer as HTMLElement | null;
          const domId = findNearestScriptElementId(node);
          if (domId) {
            const idx = elementsArray.findIndex(e => e.id === domId);
            if (idx >= 0) insertIndex = idx + 1;
          }
        }
      }

      // Defensive: prevent duplicate add if an element with same id exists
      if (elementsArray.some(e => e.id === currentElement.id)) {
        processedElementRef.current = currentElement.id;
        resetCurrentElement();
        return;
      }

      const newElement = {
        id: currentElement.id,
        type: currentElement.type,
        content: currentElement.content || "",
        position: 0,
        script_id: scriptId
      };

      // Insert locally first for immediate UI update
      const inserted = addLocalElement(newElement, insertIndex);
      console.log(`[useScriptContentState] Inserting element at index ${insertIndex}. Total elements before: ${elementsArray.length}`);

      // Get the full list of IDs in order to call atomic reorder
      // This is the most robust way to ensure no duplicates are created
      const updatedElements = [...elementsArray];
      updatedElements.splice(insertIndex, 0, newElement);

      // CRITICAL FIX: Re-assign strict sequential positions for the NEW history frame 
      // so if we Undo/Redo, the elements are perfectly sorted and don't pop to index 0 (top of script).
      const perfectlyOrderedElements = updatedElements.map((el, idx) => ({
        ...el,
        position: idx
      }));

      const elementIds = perfectlyOrderedElements.map(el => el.id);

      // Construct the new state for history immediately using the perfectly ordered elements
      pushState(perfectlyOrderedElements);

      // CRITICAL FIX: Sync the entire ordered array atomically using our optimized bulk RPC
      // instead of a partial append-and-reorder. This prevents unique constraint collisions.
      syncMultipleElementsToSupabase(perfectlyOrderedElements);
      blockRealtimeSync(3000);

      // Fix focus: Focus the exactly newly created element instead of guessing it's at the end
      setTimeout(() => {
        const newElNode = document.getElementById(`script-element-${newElement.id}`);
        if (newElNode) {
          newElNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const textarea = newElNode.querySelector('textarea, [contenteditable]');
          if (textarea instanceof HTMLElement) {
            textarea.focus();

            // Move cursor to end if it's contenteditable
            if (textarea.isContentEditable) {
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(textarea);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
        }
      }, 100);

      processedElementRef.current = currentElement.id;
      resetCurrentElement();

      if (onContentChange) onContentChange();
    }
  }, [
    currentElement,
    localElements,
    realtimeElements,
    resetCurrentElement,
    scriptId,
    useLocalElements,
    onContentChange,
    addLocalElement,
    pushState,
    focusedElementId,
    reorderElementsAtomic
  ]);

  // Handle content changes for a particular element (no position update!)
  const handleContentChange = (id, content) => {
    if (!id) return;

    // If content is empty or just whitespace, we should delete the element
    const trimmedContent = (content || "").trim();

    if (!trimmedContent || trimmedContent.length === 0) {
      // Delete the element since it's empty
      console.log('Deleting empty element:', id);

      // Find previous element to focus after deletion
      const currentIndex = localElements.findIndex(el => el.id === id);
      const previousElementId = currentIndex > 0 ? localElements[currentIndex - 1].id : null;

      // Optimistically remove from local state
      deleteLocalElement(id);

      // HISTORY: Immediate push for deletion
      const newHistoryElements = localElements.filter(el => el.id !== id);
      pushState(newHistoryElements);

      // Focus previous element if available
      if (previousElementId) {
        setTimeout(() => {
          const el = document.getElementById(`script-element-${previousElementId}`);
          if (el) {
            const textarea = el.querySelector('textarea, [contenteditable]');
            if (textarea instanceof HTMLElement) {
              textarea.focus();
              // Move cursor to end
              if (textarea.isContentEditable) {
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(textarea);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }
          }
        }, 50);
      }

      // Sync the deletion to the database
      syncElementToSupabase({
        id,
        type: 'action',
        content: '',
        _delete: true
      }).then(() => {
        if (onContentChange) onContentChange();
      });

      return;
    }

    // Just update content, don't disturb position!
    const updatedElement = updateLocalElement(id, content);

    if (updatedElement) {
      syncElementToSupabase({
        id,
        type: updatedElement.type,
        content: content || ""
      }).then(success => {
        if (success) {
          updateSelectionPosition(id);
          if (onContentChange) onContentChange();
        } else {
          console.warn("Failed to sync element changes");
        }
      });
    } else {
      // fallback if element not found
      const realtimeElement = realtimeElements.find(el => el.id === id);
      if (realtimeElement) {
        syncElementToSupabase({
          id: realtimeElement.id,
          type: realtimeElement.type,
          content: content || ''
        });
      } else {
        toast({
          title: "Warning",
          description: "Could not update element, it may have been deleted",
          variant: "destructive"
        });
      }
    }
  };

  const changeElementType = async (id: string, newType: ScriptElementType['type']) => {
    // Optimistic update on local state
    const updatedElement = changeLocalElementType(id, newType);

    if (updatedElement) {
      // Immediately push the type change to history so it is not overwritten by
      // the debounced effect (which fires 1.5s later and could use stale state).
      const currentElements = (useLocalElements ? localElements : realtimeElements) || [];
      const updatedElements = currentElements.map(el =>
        el.id === id ? { ...el, type: newType } : el
      );
      pushState(updatedElements);

      await syncElementToSupabase({
        id: updatedElement.id,
        type: newType,
        content: updatedElement.content
      });
      if (onContentChange) onContentChange();
    }
  };

  // Multi-selection state
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());
  const lastSelectedIdRef = useRef<string | null>(null);

  // Handle element click for multi-selection
  const handleElementClick = useCallback((id: string, event: React.MouseEvent) => {
    // If ordinary click without modifiers, clear selection (handled by focus usually, but good to be explicit)
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      setSelectedElementIds(new Set());
      lastSelectedIdRef.current = id;
      return;
    }

    // Toggle selection with Cmd/Ctrl
    if (event.ctrlKey || event.metaKey) {
      setSelectedElementIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      lastSelectedIdRef.current = id;
      return;
    }

    // Range selection with Shift
    if (event.shiftKey && lastSelectedIdRef.current) {
      const elementsArray = useLocalElements ? localElements : realtimeElements || [];
      const startIdx = elementsArray.findIndex(e => e.id === lastSelectedIdRef.current);
      const endIdx = elementsArray.findIndex(e => e.id === id);

      if (startIdx !== -1 && endIdx !== -1) {
        const lower = Math.min(startIdx, endIdx);
        const upper = Math.max(startIdx, endIdx);

        const rangeIds = elementsArray.slice(lower, upper + 1).map(e => e.id);

        setSelectedElementIds(prev => {
          const next = new Set(prev);
          rangeIds.forEach(rangeId => next.add(rangeId));
          return next;
        });
      }
    }
  }, [localElements, realtimeElements, useLocalElements]);

  // Batch delete selected elements
  const deleteSelectedElements = useCallback(async () => {
    if (selectedElementIds.size === 0) return;

    const idsToDelete = Array.from(selectedElementIds);
    console.log(`Deleting ${idsToDelete.length} selected elements`);

    // 1. Optimistic local update
    deleteLocalElements(idsToDelete);

    // 2. Clear selection
    setSelectedElementIds(new Set());
    lastSelectedIdRef.current = null;

    // 3. History push
    const elementsArray = useLocalElements ? localElements : realtimeElements || [];
    const remainingElements = elementsArray.filter(el => !selectedElementIds.has(el.id));
    pushState(remainingElements);

    // 4. Supabase sync
    await syncMultipleElementsToSupabase([], idsToDelete); // We need to update sync hook to handle deletes

    if (onContentChange) onContentChange();

    toast({
      title: "Deleted",
      description: `${idsToDelete.length} elements moved to trash.`
    });
  }, [selectedElementIds, deleteLocalElements, useLocalElements, localElements, realtimeElements, pushState, syncMultipleElementsToSupabase, onContentChange, toast]);

  // Listen for bulk paste events
  useEffect(() => {
    const handlePasteBulk = async (e: any) => {
      const { text, elementId } = e.detail;
      if (!text || !elementId) return;

      const elementsArray = useLocalElements ? localElements : realtimeElements || [];
      const insertIndex = elementsArray.findIndex(el => el.id === elementId);
      
      if (insertIndex === -1) return;

      try {
        const { parseScriptElements } = await import('@/utils/scriptElementParser');
        const parsed = parseScriptElements(text);
        if (parsed.length === 0) return;

        const newParsedElements = parsed.map(el => ({
          ...el,
          script_id: scriptId,
        })) as ScriptElementType[];
        
        const updatedElements = [...elementsArray];
        const targetElement = updatedElements[insertIndex];
        const isEmpty = !targetElement.content || targetElement.content.trim() === '';
        
        if (isEmpty) {
          updatedElements.splice(insertIndex, 1, ...newParsedElements);
        } else {
          updatedElements.splice(insertIndex + 1, 0, ...newParsedElements);
        }

        const reindexedElements = updatedElements.map((el, idx) => ({
          ...el,
          position: idx
        }));

        setAllElements(reindexedElements);
        pushState(reindexedElements);
        
        blockRealtimeSync(5000);
        await syncMultipleElementsToSupabase(reindexedElements);

        if (onContentChange) onContentChange();

        if (newParsedElements.length > 0) {
          setTimeout(() => {
            const el = document.getElementById(`script-element-${newParsedElements[0].id}`);
            if (el) {
              const textarea = el.querySelector('textarea, [contenteditable]');
              if (textarea instanceof HTMLElement) {
                textarea.focus();
              }
            }
          }, 100);
        }
      } catch (err) {
        console.error("Failed to parse and insert pasted elements", err);
      }
    };

    document.addEventListener('script-paste-bulk', handlePasteBulk);
    return () => document.removeEventListener('script-paste-bulk', handlePasteBulk);
  }, [localElements, realtimeElements, useLocalElements, scriptId, setAllElements, pushState, blockRealtimeSync, syncMultipleElementsToSupabase, onContentChange]);

  return {
    localElements,
    realtimeElements,
    useLocalElements,
    revision,
    handleContentChange,
    changeElementType,
    handleFocus,
    paperRef,
    blockRealtimeSync,
    setAllElements, // EXPORT setAllElements to fix the snap-back
    // Selection & Batch Delete exports
    selectedElementIds,
    handleElementClick,
    deleteSelectedElements,
    setSelectedElementIds // Exported for clearing on blur if needed
  };
};
