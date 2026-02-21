
import React, { useEffect } from "react";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { useToast } from "@/hooks/use-toast";
import { ScriptContentContainer } from "./ScriptContentContainer";

interface ScriptContentProps {
  title: string;
  scriptId: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange?: () => void;
  onElementFocus?: (elementId: string) => void;
}

export const ScriptContent = ({ 
  title, 
  scriptId, 
  onTitleChange,
  onContentChange,
  onElementFocus
}: ScriptContentProps) => {
  const { elements, isLoaded, addElement } = useScriptContent(scriptId);
  const { resetCurrentElement } = useScriptEditor();
  const { toast } = useToast();

  // Initialize with default element only if script is new and has no elements
  useEffect(() => {
    if (isLoaded && elements && elements.length === 0 && scriptId) {
      console.log("No elements found, checking for backup...");
      
      try {
        // Check localStorage for backup first
        const backup = localStorage.getItem(`scriptBackup_${scriptId}`);
        if (backup) {
          const parsedBackup = JSON.parse(backup);
          if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
            console.log(`Found backup with ${parsedBackup.length} elements, not adding default element`);
            return;
          }
        }
        
        // Only add default element if no backup exists
        console.log("Adding default element for new script");
        addElement('action', 'Start writing your script here.');
        
        // Reset current element to prevent duplication
        resetCurrentElement();
        
        // Notify parent of content change
        if (onContentChange) {
          onContentChange();
        }
      } catch (error) {
        console.error('Error handling initial content:', error);
        toast({
          title: "Error",
          description: "Failed to initialize script content",
          variant: "destructive"
        });
      }
    }
  }, [isLoaded, elements, scriptId, addElement, resetCurrentElement, onContentChange, toast]);

  return (
    <div className="flex flex-1 overflow-hidden bg-[#222222] text-white">
      <ScriptContentContainer
        title={title}
        scriptId={scriptId}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onElementFocus={onElementFocus}
      />
    </div>
  );
};
