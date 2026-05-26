
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

  // Helper function to save cursor position (cross-browser robust)
  const getAbsoluteCursorPosition = (element: HTMLElement): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
  
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    
    try {
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    } catch (e) {
      return 0;
    }
  };

  // Update collaborator cursor with selection position
  const updateSelectionPosition = (elementId: string) => {
    // Find the contenteditable element directly
    const element = document.getElementById(elementId);
    if (element) {
      const position = getAbsoluteCursorPosition(element);
      updateCollaboratorCursor(elementId, position);
    }
  };

  return {
    handleFocus,
    updateSelectionPosition,
    paperRef
  };
};
