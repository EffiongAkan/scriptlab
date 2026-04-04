import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save, Undo2, Redo2, Keyboard, AlertCircle, Sparkles, Clock, Users, Menu, FileUp, Settings2, CaseUpper, CaseLower } from "lucide-react";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";
import { useScriptHistory } from "@/contexts/ScriptHistoryContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportModal } from "@/components/script-editor/ExportModal";
import { TreatmentGeneratorModal } from "@/components/script-editor/TreatmentGeneratorModal";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  onRepairOrder?: () => Promise<void>;
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
  onTitleChange,
  onRepairOrder
}: ScriptToolbarProps) => {
  const {
    elements,
    isLoaded,
    loadError,
    scriptData,
    updateElement
  } = useScriptContent(scriptId);

  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = React.useState(false);
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

  return (
    <>
      {/* Desktop Toolbar - Hidden on mobile */}
      <div className="hidden md:flex justify-between items-center py-4 border-b border-gray-700 w-full gap-2 px-0 bg-[#1A1A1A] sticky top-0 z-40">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Editable Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              className="text-base md:text-3xl font-bold tracking-tight text-gray-300 bg-transparent border-none hover:bg-gray-800/50 rounded px-1 focus:ring-2 focus:ring-naija-green focus:outline-none w-full min-w-[120px] max-w-full relative z-10 pointer-events-auto cursor-text truncate"
              placeholder="Untitled Script"
              aria-label="Script Title"
            />

            {/* Desktop Status indicators */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
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

          <div className="hidden md:flex flex-wrap items-center gap-2 md:gap-4 mt-1">
            <p className="text-muted-foreground text-sm">
              Professional screenplay formatting for African storytellers
            </p>

            {/* Content and save status */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              {contentCount !== null && <span className="text-xs text-muted-foreground">{contentCount} elements</span>}

              {lastSavedAt && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                {formatLastSavedTime()}
              </span>}

              {!lastSavedAt && isLoaded && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium border border-orange-500/20">
                <Clock className="h-3 w-3" />
                <span>Unsaved changes</span>
              </span>}

              {/* Active users badge */}
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20">
                <Users className="h-3 w-3" />
                <span>1 active</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">

          {/* Desktop specific buttons */}
          <div className="hidden md:flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleUndo} disabled={!effectiveCanUndo || isSaving} className="h-10 w-10 border-gray-700 hover:bg-gray-800">
                    <Undo2 className="h-4 w-4" />
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
                  <Button variant="outline" size="icon" onClick={handleRedo} disabled={!effectiveCanRedo || isSaving} className="h-10 w-10 border-gray-700 hover:bg-gray-800">
                    <Redo2 className="h-4 w-4" />
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
                <Button variant="outline" disabled={isSaving || !isLoaded} className="h-10 px-3 min-w-[100px] border-gray-700 hover:bg-gray-800 text-sm">
                  Export
                </Button>
              }
            />


          </div>

          {/* Main Actions (Save & AI) */}
          <Button className="h-7 w-7 md:h-10 md:w-auto md:px-3 text-[10px] md:text-sm rounded-full md:rounded-md bg-naija-green hover:bg-naija-green-dark text-white p-0 md:min-w-[100px] flex items-center justify-center shrink-0" onClick={handleSave} disabled={isSaving || !isLoaded} aria-label="Save">
            <Save className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="md:block hidden">{isSaving ? "Saving..." : "Save"}</span>
          </Button>

          <Button
            className="h-7 w-7 md:h-10 md:w-auto md:px-3 text-[10px] md:text-sm rounded-full md:rounded-md bg-emerald-600 hover:bg-emerald-500 text-white p-0 md:min-w-[120px] shadow-lg shadow-emerald-900/20 flex items-center justify-center shrink-0"
            onClick={() => {
              document.dispatchEvent(new CustomEvent('toggle-ai-prompt'));
            }}
            aria-label="AI Assistant"
          >
            <Sparkles className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="md:block hidden">Modify Script</span>
          </Button>

          <Button
            className="h-7 w-7 md:h-10 md:w-auto md:px-3 text-[10px] md:text-sm rounded-full md:rounded-md bg-naija-gold hover:bg-yellow-500 text-black p-0 md:min-w-[120px] shadow-lg shadow-yellow-900/20 flex items-center justify-center shrink-0"
            onClick={() => setIsTreatmentModalOpen(true)}
            aria-label="Treatment"
          >
            <FileText className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="md:block hidden">Treatment</span>
          </Button>
        </div>
      </div>

      {/* Mobile Floating Action Button - Only visible on mobile */}
      <div className="md:hidden fixed bottom-32 right-6 z-[100]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-14 w-14 rounded-full bg-naija-green hover:bg-naija-green-dark text-white shadow-2xl flex items-center justify-center border-2 border-white/20">
              <Settings2 className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 bg-[#1E1E1E] border-gray-800 text-gray-300 p-2 mb-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-800 mb-2">
              Script Tools
            </div>

            <DropdownMenuItem onClick={handleSave} disabled={isSaving || !isLoaded} className="cursor-pointer py-3 rounded-md focus:bg-naija-green focus:text-white">
              <Save className="h-4 w-4 mr-3" />
              <div className="flex flex-col">
                <span className="font-semibold">{isSaving ? "Saving..." : "Save Project"}</span>
                {lastSavedAt && <span className="text-[10px] opacity-70">Last: {formatLastSavedTime()}</span>}
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => document.dispatchEvent(new CustomEvent('toggle-ai-prompt'))}
              className="cursor-pointer py-3 rounded-md focus:bg-emerald-600 focus:text-white"
            >
              <Sparkles className="h-4 w-4 mr-3" />
              <span>AI Assistant</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setIsTreatmentModalOpen(true)}
              className="cursor-pointer py-3 rounded-md focus:bg-naija-gold focus:text-black"
            >
              <FileText className="h-4 w-4 mr-3" />
              <span>Generate Treatment</span>
            </DropdownMenuItem>

            <div className="my-1 border-t border-gray-800" />

            <div className="grid grid-cols-2 gap-1 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!effectiveCanUndo || isSaving}
                className="h-10 flex flex-col items-center justify-center gap-1 text-[10px]"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!effectiveCanRedo || isSaving}
                className="h-10 flex flex-col items-center justify-center gap-1 text-[10px]"
              >
                <Redo2 className="h-4 w-4" />
                Redo
              </Button>
            </div>

            <div className="my-1 border-t border-gray-800" />

            <div className="grid grid-cols-2 gap-1 p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 flex flex-col items-center justify-center gap-1 text-[10px]"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('script-transform-case', { detail: { mode: 'uppercase' } }));
                }}
              >
                <CaseUpper className="h-4 w-4" />
                Uppercase
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 flex flex-col items-center justify-center gap-1 text-[10px]"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('script-transform-case', { detail: { mode: 'lowercase' } }));
                }}
              >
                <CaseLower className="h-4 w-4" />
                Lowercase
              </Button>
            </div>

            <div className="my-1 border-t border-gray-800" />

            {/* Using a custom item for Export since it requires trigger wrapping */}
            <ExportModal
              scriptId={scriptId}
              title={title}
              elements={elements || []}
              trigger={
                <button
                  className="w-full text-left relative flex cursor-default select-none items-center rounded-md px-2 py-3 text-sm outline-none transition-colors hover:bg-gray-800 hover:text-white bg-transparent"
                  disabled={isSaving || !isLoaded}
                >
                  <FileUp className="h-4 w-4 mr-3" />
                  <span>Export Script</span>
                </button>
              }
            />



            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="cursor-pointer py-3 rounded-md flex items-center">
                <Menu className="h-4 w-4 mr-3" />
                <span>Go to Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TreatmentGeneratorModal
        isOpen={isTreatmentModalOpen}
        onOpenChange={setIsTreatmentModalOpen}
        scriptData={scriptData as any}
        scriptElements={elements || []}
        currentTreatment={scriptData?.treatment || ""}
        onSaveTreatment={async (newTreatment) => {
          try {
            const payload: any = { treatment: newTreatment };
            const { error } = await supabase
              .from('scripts')
              .update(payload)
              .eq('id', scriptId);

            if (error) throw error;
            setIsTreatmentModalOpen(false);
          } catch (err) {
            console.error("Failed to save treatment directly in toolbar:", err);
            throw err;
          }
        }}
      />
    </>
  );
};