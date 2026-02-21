
import { useCollaboration } from "@/contexts/CollaborationContext";
import { useScriptCursor } from "@/hooks/useScriptCursor";

export const useCollaborativeCursor = () => {
  const { updateCursorPosition: updateCollaboratorCursor } = useCollaboration();
  const { paperRef, updateCursorPosition } = useScriptCursor();

  // Handle cursor position updates for collaboration
  const handleFocus = (elementId: string) => {
    updateCursorPosition(elementId);
    
    // Update collaborator cursor position
    updateCollaboratorCursor(elementId, 0);
  };

  // Update collaborator cursor with selection position
  const updateSelectionPosition = (elementId: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range.startContainer.parentElement?.id === elementId) {
        updateCollaboratorCursor(elementId, range.startOffset);
      }
    }
  };

  return {
    handleFocus,
    updateSelectionPosition,
    paperRef
  };
};
