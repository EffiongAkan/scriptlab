
import { useEffect } from "react";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { useScriptHistory } from "@/contexts/ScriptHistoryContext";
import { useToast } from "@/hooks/use-toast";

export function useScriptShortcuts() {
  const { insertScriptElement } = useScriptEditor();
  const { undo, redo, canUndo, canRedo } = useScriptHistory();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            if (canRedo) {
              redo();
              toast({
                title: "Redo",
                description: "Action redone",
                duration: 1500,
              });
            }
          } else if (canUndo) {
            undo();
            toast({
              title: "Undo",
              description: "Action undone",
              duration: 1500,
            });
          }
        }

        // Quick element insertion shortcuts (Ctrl/Cmd + Shift + Key)
        if (e.shiftKey) {
          switch (e.key) {
            case 'H':
              e.preventDefault();
              insertScriptElement('heading');
              toast({
                title: "Scene Heading Added",
                description: "Use Ctrl+Shift+H",
                duration: 2000,
              });
              break;
            case 'A':
              e.preventDefault();
              insertScriptElement('action');
              toast({
                title: "Action Added",
                description: "Use Ctrl+Shift+A",
                duration: 2000,
              });
              break;
            case 'C':
              e.preventDefault();
              insertScriptElement('character');
              toast({
                title: "Character Added",
                description: "Use Ctrl+Shift+C",
                duration: 2000,
              });
              break;
            case 'D':
              e.preventDefault();
              insertScriptElement('dialogue');
              toast({
                title: "Dialogue Added",
                description: "Use Ctrl+Shift+D",
                duration: 2000,
              });
              break;
            case 'P':
              e.preventDefault();
              insertScriptElement('parenthetical');
              toast({
                title: "Parenthetical Added",
                description: "Use Ctrl+Shift+P",
                duration: 2000,
              });
              break;
            case 'T':
              e.preventDefault();
              insertScriptElement('transition');
              toast({
                title: "Transition Added",
                description: "Use Ctrl+Shift+T",
                duration: 2000,
              });
              break;
            case 'U':
              e.preventDefault();
              const upperEvent = new CustomEvent('script-transform-case', { detail: { mode: 'uppercase' } });
              document.dispatchEvent(upperEvent);
              break;
            case 'L':
              e.preventDefault();
              const lowerEvent = new CustomEvent('script-transform-case', { detail: { mode: 'lowercase' } });
              document.dispatchEvent(lowerEvent);
              break;
          }
        }

        // Save shortcut
        if (e.key === 's' && !e.shiftKey) {
          e.preventDefault();
          // Trigger save event
          const saveEvent = new CustomEvent('script-save');
          document.dispatchEvent(saveEvent);
          toast({
            title: "Save Triggered",
            description: "Ctrl+S pressed",
            duration: 1500,
          });
        }
      }

      // Tab for quick format switching (without modifier keys)
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !e.defaultPrevented) {
        const activeElement = document.activeElement as HTMLElement;
        const activeContainer = activeElement?.closest('[data-element-id]');
        if (activeContainer) {
          e.preventDefault();
          const elementId = activeContainer.getAttribute('data-element-id');
          const currentType = activeContainer.getAttribute('data-element-type');

          if (elementId && currentType) {
            // Dispatch a custom event to change the format of the current element
            const formatEvent = new CustomEvent('script-format-change', {
              detail: { id: elementId, currentType }
            });
            document.dispatchEvent(formatEvent);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [insertScriptElement, undo, redo, canUndo, canRedo, toast]);

  // Show shortcuts help
  useEffect(() => {
    const showHelp = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toast({
          title: "Keyboard Shortcuts",
          description: "Ctrl+Shift+H: Heading, Ctrl+Shift+A: Action, Ctrl+Shift+C: Character, Ctrl+Shift+D: Dialogue, Ctrl+Shift+P: Parenthetical, Ctrl+Shift+T: Transition, Ctrl+Shift+U: Uppercase, Ctrl+Shift+L: Lowercase, Ctrl+Z: Undo, Ctrl+Shift+Z: Redo, Ctrl+S: Save",
          duration: 8000,
        });
      }
    };

    document.addEventListener('keydown', showHelp);
    return () => document.removeEventListener('keydown', showHelp);
  }, [toast]);
}
