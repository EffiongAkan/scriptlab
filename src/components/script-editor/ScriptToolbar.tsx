import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Undo2, Redo2, Keyboard, AlertCircle, Sparkles, Clock, Users } from "lucide-react";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";
import { useScriptHistory } from "@/contexts/ScriptHistoryContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportModal } from "@/components/script-editor/ExportModal";
interface ScriptToolbarProps {
  scriptId: string;
  title: string;
  onSave: () => Promise<void>;
  isSaving: boolean;
  lastSavedAt?: Date | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onTitleChange?: (newTitle: string) => void;
}

export const ScriptToolbar = ({
  scriptId,
  title,
  onSave,
  isSaving,
  lastSavedAt,
  onUndo,
  onRedo,
  canUndo: propCanUndo,
  canRedo: propCanRedo,
  onTitleChange
}: ScriptToolbarProps) => {
  const {
    elements,
    isLoaded,
    loadError
  } = useScriptContent(scriptId);
  const {
    toast
  } = useToast();
  const {
    undo,
    redo,
    canUndo: contextCanUndo,
    canRedo: contextCanRedo
  } = useScriptHistory();

  // Calculate effective values falling back to context
  const effectiveCanUndo = propCanUndo ?? contextCanUndo ?? false;
  const effectiveCanRedo = propCanRedo ?? contextCanRedo ?? false;
  const handleUndo = onUndo || undo;
  const handleRedo = onRedo || redo;

  const handleSave = async () => {
    try {
      if (!isLoaded) {
        toast({
          title: "Please Wait",
          description: "Script is still loading. Please try again in a moment.",
          variant: "destructive"
        });
        return;
      }
      if (loadError) {
        toast({
          title: "Cannot Save",
          description: `Loading error: ${loadError}`,
          variant: "destructive"
        });
        return;
      }
      await onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Format the last saved time with more detail
  const formatLastSavedTime = () => {
    if (!lastSavedAt) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastSavedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
      return "Saved just now";
    } else if (diffMins === 1) {
      return "Saved 1 minute ago";
    } else if (diffMins < 60) {
      return `Saved ${diffMins} minutes ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      if (hours === 1) {
        return remainingMins > 0 ? `Saved 1 hour ${remainingMins}m ago` : "Saved 1 hour ago";
      } else {
        return remainingMins > 0 ? `Saved ${hours} hours ${remainingMins}m ago` : `Saved ${hours} hours ago`;
      }
    }
  };

  // Get content statistics
  const getContentStats = () => {
    if (!elements || elements.length === 0) return null;
    const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');
    return validElements.length;
  };
  const contentCount = getContentStats();

  // Custom prop for showAIPromptBox logic could be added here if needed, 
  // but for now we'll just add the button that triggers the event/state change.
  // The EditorContent.tsx manages the showAIPromptBox state.
  // We'll use a local button that can be clicked to toggle it if passed as a prop,
  // or just render it if the user wants it here.

  return <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-2 md:py-4 border-b border-gray-700 gap-2 md:gap-0">
    <div className="w-full md:w-auto">
      <div className="flex items-center justify-between md:justify-start gap-3">
        {/* Editable Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="text-xl md:text-3xl font-bold tracking-tight text-gray-300 bg-transparent border-none hover:bg-gray-800/50 rounded px-1 focus:ring-2 focus:ring-naija-green focus:outline-none w-full md:w-auto min-w-[200px] relative z-10 pointer-events-auto cursor-text"
          placeholder="Untitled Script"
          aria-label="Script Title"
        />

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          {loadError && <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Loading Error: {loadError}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>}

          {!isLoaded && !loadError && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 mt-1 flex-wrap">
        <p className="text-muted-foreground hidden md:block">
          Professional screenplay formatting for African storytellers
        </p>

        {/* Content and save status */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {contentCount !== null && <span className="text-[10px] md:text-xs text-muted-foreground">{contentCount} elements</span>}

          {lastSavedAt && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            {formatLastSavedTime()}
          </span>}

          {!lastSavedAt && isLoaded && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-medium border border-orange-500/20">
            <Clock className="h-3 w-3" />
            <span className="hidden md:inline">Unsaved changes</span>
            <span className="md:hidden">Unsaved</span>
          </span>}

          {/* Active users badge */}
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20">
            <Users className="h-3 w-3" />
            <span className="hidden md:inline">1 active</span>
            <span className="md:hidden">1</span>
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-1 md:gap-2 w-full md:w-auto justify-end">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleUndo} disabled={!effectiveCanUndo || isSaving} className="h-8 w-8 md:h-10 md:w-10 border-gray-700 hover:bg-gray-800">
              <Undo2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl/⌘ + Z)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleRedo} disabled={!effectiveCanRedo || isSaving} className="h-8 w-8 md:h-10 md:w-10 border-gray-700 hover:bg-gray-800">
              <Redo2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl/⌘ + Shift + Z)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ExportModal
        scriptId={scriptId}
        title={title}
        elements={elements || []}
        trigger={
          <Button variant="outline" disabled={isSaving || !isLoaded} className="h-8 md:h-10 px-3 md:min-w-[100px] border-gray-700 hover:bg-gray-800 text-xs md:text-sm">
            Export
          </Button>
        }
      />

      <Button className="h-8 md:h-10 px-3 bg-naija-green hover:bg-naija-green-dark text-white md:min-w-[100px] text-xs md:text-sm" onClick={handleSave} disabled={isSaving || !isLoaded}>
        <Save className="mr-0 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
        <span className="md:block hidden">{isSaving ? "Saving..." : "Save"}</span>
        <span className="md:hidden block">Save</span>
      </Button>

      <Button
        className="h-8 md:h-10 px-3 bg-emerald-600 hover:bg-emerald-500 text-white md:min-w-[120px] shadow-lg shadow-emerald-900/20 text-xs md:text-sm"
        onClick={() => {
          document.dispatchEvent(new CustomEvent('toggle-ai-prompt'));
        }}
      >
        <Sparkles className="mr-0 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
        <span className="md:block hidden">Modify Script</span>
        <span className="md:hidden block">AI</span>
      </Button>
    </div>
  </div>;

};