import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScriptPaper, ScriptTitle } from "@/components/ui/script-paper";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useScriptContent, ScriptElementType } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScriptRealtime } from "@/hooks/useScriptRealtime";
import { ScriptElementList } from "./script-content/ScriptElementList";
import { useScriptContentState } from "@/hooks/useScriptContentState";
import { useCollaboration } from "@/contexts/CollaborationContext";
import { ScriptLoadingState } from "./script-content/ScriptLoadingState";
import { ScriptFormatToolbar } from "./script-content/ScriptFormatToolbar";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { ScriptStatisticsFooter } from "./script-content/ScriptStatisticsFooter";
import { CollaborativeIndicators } from "./CollaborativeIndicators";
import { ScriptOutlineNav } from "./ScriptOutlineNav";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { sanitizeScriptContent } from "@/utils/sanitize-script-content";
import { validateAndCleanContent } from "@/utils/scriptElementParser";
import { ScriptCommentsSidebar } from "@/components/comments/ScriptCommentsSidebar";
import { useQuoteSelection } from "@/hooks/useQuoteSelection";
import { useScriptComments } from "@/hooks/useScriptComments";
import { Quote, MessageSquare, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScriptAISidebar } from "./ScriptAISidebar";
import { FloatingSuggestions } from "./FloatingSuggestions";
import { cn } from "@/lib/utils";

interface ScriptContentContainerProps {
  title: string;
  scriptId: string;
  elements?: ScriptElementType[]; // Optional: if provided, use these instead of loading from DB
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange?: () => void;
  onElementFocus?: (elementId: string) => void;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
}

export const ScriptContentContainer = ({
  title,
  scriptId,
  elements: propsElements, // Elements from parent (if provided)
  onTitleChange,
  onContentChange,
  onElementFocus,
  isSaving = false,
  lastSavedAt,
  hasUnsavedChanges = false
}: ScriptContentContainerProps) => {
  const { elements: initialElements, isLoaded, loadError, reorderElements, updateElement } = useScriptContent(scriptId);

  // Use elements from props if provided (controlled mode), otherwise use database elements
  const elementsToUse = propsElements !== undefined ? propsElements : initialElements;

  const { toast } = useToast();
  const [zoom, setZoom] = useState<string>("100%");
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      // Auto-close outline on mobile initially
      if (window.innerWidth < 768) {
        setIsOutlineOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    localElements,
    realtimeElements, // Destructure the internal realtime state
    useLocalElements,
    revision,
    handleContentChange,
    changeElementType,
    paperRef,
    blockRealtimeSync,
    selectedElementIds,
    handleElementClick,
    deleteSelectedElements
  } = useScriptContentState(scriptId, elementsToUse, onContentChange);
  const { insertScriptElement } = useScriptEditor();

  // Handle delete key for batch deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if we have a selection and user is not typing in a textarea
      // Actually, if we are focused on a textarea, we might want to delete text, not elements
      // BUT if elements are explicitly selected (via click), we should prioritize batch delete?
      // Let's safe guard: if activeElement is a textarea, only delete if selection is empty/collapsed

      if (selectedElementIds.size > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        // If typing in an input, don't delete elements unless they are not focused
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'textarea' || activeTag === 'input') {
          return; // Let native behavior handle text deletion
        }

        e.preventDefault();
        if (confirm(`Are you sure you want to delete ${selectedElementIds.size} elements?`)) {
          deleteSelectedElements();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, deleteSelectedElements]);

  // Commenting & Selection
  const { selection: quoteSelection, clearSelection } = useQuoteSelection();
  const { comments, addComment, isLoading: commentsLoading } = useScriptComments(scriptId);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [guestName, setGuestName] = useState(""); // Not used for authed users but sidebar needs props
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPostingComment(true);
    try {
      // Default to first element if no specific ID
      const elementId = quoteSelection?.elementId || scriptElements[0]?.id;
      await addComment(newComment, elementId);
      setNewComment("");
      toast({ title: "Comment posted" });
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleQuoteSelection = () => {
    if (quoteSelection) {
      setNewComment(prev => `> "${quoteSelection.text}"\n\n${prev}`);
      setIsCommentsOpen(true);
      clearSelection();
    }
  };

  const handleAIModify = () => {
    if (quoteSelection) {
      console.log("[ScriptContentContainer] Modifying selection with AI:", quoteSelection.text);

      const event = new CustomEvent('modify-selection-ai', {
        detail: {
          text: quoteSelection.text,
          elementId: quoteSelection.elementId
        }
      });
      document.dispatchEvent(event);
      clearSelection();
    }
  };

  // Listen for save shortcut events
  useEffect(() => {
    const handleSaveShortcut = () => {
      if (onContentChange) {
        onContentChange();
      }
    };

    document.addEventListener('script-save', handleSaveShortcut);
    return () => document.removeEventListener('script-save', handleSaveShortcut);
  }, [onContentChange]);

  // Show toast for load errors
  useEffect(() => {
    if (loadError) {
      toast({
        title: "Loading Error",
        description: loadError,
        variant: "destructive"
      });
    }
  }, [loadError, toast]);

  // Use the appropriate elements array based on our state
  const scriptElements = useLocalElements ? localElements : realtimeElements;

  // === Pagination logic ===
  const totalPages = Math.ceil(scriptElements.length / PAGE_SIZE);
  const paginatedScriptElements = scriptElements.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // === Accessibility: Add ARIA landmarks/roles ===

  const toggleOutline = () => {
    setIsOutlineOpen(!isOutlineOpen);
  };

  const handleElementFocusInternal = (elementId: string) => {
    setFocusedElementId(elementId);
    if (onElementFocus) {
      onElementFocus(elementId);
    }
  };

  // Derive the type of the currently focused element for the mobile toolbar
  const focusedElement = scriptElements.find(el => el.id === focusedElementId);
  const activeElementType = focusedElement?.type ?? null;

  const scrollToElementId = useCallback((elementId: string) => {
    // Find the element index in the full scriptElements array
    const elementIndex = scriptElements.findIndex(el => el.id === elementId);

    if (elementIndex === -1) {
      console.warn(`Element with ID ${elementId} not found`);
      return;
    }

    // Calculate which page the element is on
    const targetPage = Math.floor(elementIndex / PAGE_SIZE);

    // If we need to switch pages
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);

      // Wait for the page to render, then scroll to the element
      setTimeout(() => {
        const element = document.getElementById(`script-element-${elementId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Highlight the element briefly
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element?.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 300); // Wait for page render
    } else {
      // Element is on current page, scroll immediately
      const element = document.getElementById(`script-element-${elementId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight the element briefly
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          element?.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }

    // Also call the focus handler
    handleElementFocusInternal(elementId);
  }, [scriptElements, currentPage, handleElementFocusInternal]);

  // Handle scene reordering
  const handleSceneReorder = useCallback(async (sceneId: string, insertBeforeIndex: number) => {
    try {
      // Find all elements in the scene being moved
      const sceneElements: ScriptElementType[] = [];
      let foundScene = false;

      for (const element of scriptElements) {
        if (element.id === sceneId) {
          foundScene = true;
        }

        if (foundScene) {
          // Stop at the next heading (start of next scene)
          if (element.id !== sceneId && element.type === 'heading') {
            break;
          }
          sceneElements.push(element);
        }
      }

      if (sceneElements.length === 0) {
        return;
      }

      // Find the current index of the scene being moved
      let currentSceneIndex = -1;
      let sceneCount = 0;
      for (const element of scriptElements) {
        if (element.type === 'heading') {
          if (element.id === sceneId) {
            currentSceneIndex = sceneCount;
            break;
          }
          sceneCount++;
        }
      }

      if (currentSceneIndex === -1) return;

      // Remove scene elements from their current position FIRST
      const newElements = scriptElements.filter(
        el => !sceneElements.find(se => se.id === el.id)
      );

      // Count total scenes remaining
      const filteredSceneCount = newElements.filter(e => e.type === 'heading').length;

      // Calculate target element index in the filtered array
      // We calculate the target index relative to the FILTERED list.
      let finalInsertIndex = 0;

      // If we are appending to the end
      if (insertBeforeIndex >= filteredSceneCount) {
        finalInsertIndex = newElements.length;
      } else {
        // We need to find the scene that will be at `insertBeforeIndex` AFTER the move.
        // We iterate through the original elements to find the Nth scene (where N = insertBeforeIndex)
        // SKIPPING the scene we are currently moving.

        let currentFilteredSceneCount = 0;
        let targetFound = false;

        for (let i = 0; i < newElements.length; i++) {
          if (newElements[i].type === 'heading') {
            if (currentFilteredSceneCount === insertBeforeIndex) {
              finalInsertIndex = i;
              targetFound = true;
              break;
            }
            currentFilteredSceneCount++;
          }
        }

        // If we didn't find the target scene (e.g. insertBeforeIndex was too high), append to end
        if (!targetFound) {
          finalInsertIndex = newElements.length;
        }
      }

      // Insert at new position
      newElements.splice(finalInsertIndex, 0, ...sceneElements);

      // Use the hook function to update local state and persist
      if (reorderElements) {
        // Block realtime sync temporarily to prevent "snap back" due to partial updates
        if (blockRealtimeSync) {
          blockRealtimeSync(5000); // 5 seconds grace period
        }

        await reorderElements(newElements);

        toast({
          title: "Scene reordered",
          description: "The scene has been moved successfully"
        });

        // Trigger content change to refresh the view
        if (onContentChange) {
          onContentChange();
        }
      }
    } catch (error) {
      console.error('Error reordering scene:', error);
      toast({
        title: "Error",
        description: "Failed to reorder scene",
        variant: "destructive"
      });
    }
  }, [scriptElements, toast, onContentChange, reorderElements]);

  // === Pagination controls ===
  const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  // Reset to first page when scriptElements change/length shrinks
  useEffect(() => {
    if (currentPage > 0 && (currentPage * PAGE_SIZE >= scriptElements.length)) {
      setCurrentPage(0);
    }
  }, [scriptElements.length]);

  return (
    <div className="flex flex-col w-full bg-[#1A1A1A] h-full" role="main" aria-label="Script editor main area">
      <div className="flex flex-1 overflow-hidden h-full border border-gray-800 rounded-lg relative">
        {/* Mobile Sidebar Backdrop */}
        {isMobileView && isOutlineOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-20 backdrop-blur-sm"
            onClick={() => setIsOutlineOpen(false)}
          />
        )}

        {/* Left Side: Structure/Outline */}
        <aside
          className={cn(
            "bg-[#1E1E1E] border-r border-gray-800 transition-all duration-300 overflow-hidden flex flex-col z-30",
            isMobileView
              ? `absolute inset-y-0 left-0 h-full shadow-2xl ${isOutlineOpen ? "w-[85%]" : "w-0 border-none"}`
              : isOutlineOpen ? "w-[300px]" : "w-0"
          )}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Structure</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500" onClick={toggleOutline}>
              <ChevronRight className={cn("h-4 w-4 transition-transform", isOutlineOpen && "rotate-180")} />
            </Button>
          </div>
          <ScriptOutlineNav
            elements={scriptElements}
            onElementClick={(id) => {
              scrollToElementId(id);
              if (isMobileView) setIsOutlineOpen(false);
            }}
            onScrollToElement={scrollToElementId}
            onReorder={handleSceneReorder}
            className="flex-1 border-0 bg-transparent"
          />
        </aside>

        {/* Center: Script Canvas */}
        <main className="flex-1 bg-[#121212] relative overflow-hidden">
          <div
            className="absolute inset-0 overflow-y-auto overscroll-contain flex flex-col items-center"
            style={{ overscrollBehaviorY: 'contain' }}
          >
            {/* Format Toolbar Integrated into Writing Area */}
            <div className="w-full z-[60] fixed bottom-0 left-0 md:relative md:sticky md:top-0">
              <ScriptFormatToolbar
                zoom={zoom}
                onZoomChange={setZoom}
                onInsertElement={insertScriptElement}
                onToggleSceneNav={toggleOutline}
                isSceneNavOpen={isOutlineOpen}
                activeElementType={activeElementType}
                onChangeElementType={(newType) => {
                  if (focusedElementId) {
                    changeElementType(focusedElementId, newType);
                  }
                }}
              />
            </div>

            <div className="py-0 md:py-10 px-0 md:px-4 flex flex-col items-center w-full pb-16 md:pb-10">
              <div className="w-full max-w-none md:max-w-[210mm] relative shadow-none md:shadow-2xl mb-12 md:mb-0">
                {/* "Saving..." Indicator positioned top right of paper */}
                <div className="hidden md:flex absolute -top-10 right-0 items-center gap-2 font-medium text-gray-500 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5 z-10">
                  <AutoSaveIndicator
                    isSaving={isSaving}
                    lastSavedAt={lastSavedAt}
                    hasUnsavedChanges={hasUnsavedChanges}
                  />
                </div>

                {/* Title Header above paper */}
                <div className="w-full bg-[#1E1E1E] border md:border-b-0 border-gray-800 rounded-t-lg p-3 md:p-4 flex items-center justify-center">
                  <input
                    type="text"
                    value={title}
                    onChange={onTitleChange}
                    className="md:hidden w-full text-center bg-transparent border-none text-gray-200 font-bold text-lg focus:ring-0 focus:outline-none"
                    placeholder="Untitled Script"
                  />
                  <span className="hidden md:block text-gray-400 font-bold tracking-widest uppercase text-sm truncate max-w-[200px]">{title || "THE KICK"}</span>
                </div>

                <ScriptPaper
                  ref={paperRef}
                  data-script-paper
                  className="relative bg-white text-black min-h-[50vh] md:min-h-[297mm] p-1 px-4 md:p-[1.5in] shadow-sm rounded-none md:rounded-t-none"
                  style={{ zoom: isMobileView ? '100%' : zoom }}
                  aria-label="Script paper"
                >
                  <div className="hidden md:block">
                    <ScriptTitle>{sanitizeScriptContent(title)}</ScriptTitle>
                  </div>
                  {scriptElements.length > 0 ? (
                    <>
                      <ScriptElementList
                        scriptElements={paginatedScriptElements.map(e => ({
                          ...e,
                          content: e.content ? sanitizeScriptContent(validateAndCleanContent(e.content)) : "",
                        }))}
                        collaborators={[]}
                        paperRef={paperRef}
                        onContentChange={handleContentChange}
                        onElementFocus={handleElementFocusInternal}
                        scriptId={scriptId}
                        updateElement={updateElement}
                        changeElementType={changeElementType}
                        revision={revision}
                        selectedElementIds={selectedElementIds}
                        onElementClick={handleElementClick}
                      />

                      {totalPages > 1 && (
                        <div className="mt-20 border-t border-gray-100 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                          <span>PAGE {currentPage + 1} OF {totalPages}</span>
                          <div className="flex gap-2">
                            <button onClick={handlePrevPage} disabled={currentPage === 0} className="hover:text-gray-900 disabled:opacity-30">PREV</button>
                            <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="hover:text-gray-900 disabled:opacity-30">NEXT</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <ScriptLoadingState isLoaded={isLoaded} loadError={loadError} />
                  )}
                </ScriptPaper>
              </div>

              <ScriptStatisticsFooter scriptElements={scriptElements} />
            </div>
          </div>
        </main>
      </div>


      {/* Global Comments Sidebar */}
      <ScriptCommentsSidebar
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        comments={comments}
        user={user}
        guestName={guestName}
        setGuestName={setGuestName}
        newComment={newComment}
        setNewComment={setNewComment}
        onPostComment={handlePostComment}
        isSubmitting={isPostingComment}
      />

      {/* Floating Quote Button */}
      {quoteSelection && (
        <div
          className="fixed z-50 animate-in zoom-in duration-200"
          style={{ top: quoteSelection.top, left: quoteSelection.left }}
        >
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAIModify}
              className="rounded-full shadow-xl bg-teal-600 hover:bg-teal-700 text-white border-2 border-white"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Modify with AI
            </Button>
            <Button
              size="sm"
              onClick={handleQuoteSelection}
              className="rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-white"
            >
              <Quote className="h-4 w-4 mr-1" />
              Quote & Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
