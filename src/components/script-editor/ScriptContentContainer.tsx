import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { useScriptHistory } from "@/contexts/ScriptHistoryContext";
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
import { Quote, MessageSquare, ChevronRight, Sparkles, Search, Plus, Cloud, PanelLeft, PanelLeftClose, ChevronUp, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScriptAISidebar } from "./ScriptAISidebar";
import { FloatingSuggestions } from "./FloatingSuggestions";
import { MobileElementActionSheet } from "./MobileElementActionSheet";
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
  const { elements: initialElements, isLoaded, loadError, reorderElements, updateElement, deleteElements } = useScriptContent(scriptId);

  // Use elements from props if provided (controlled mode), otherwise use database elements
  const elementsToUse = propsElements !== undefined ? propsElements : initialElements;

  const { toast } = useToast();
  const [zoom, setZoom] = useState<string>("100%");
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const { focusedElementId, setFocusedElementId, insertScriptElement } = useScriptEditor();
  const { undo, redo, canUndo, canRedo } = useScriptHistory();
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      // Auto-close outline on outline on mobile initially
      if (window.innerWidth < 768) {
        setIsOutlineOpen(false);
      }
    };

    const handleToggleComments = () => {
      setIsCommentsOpen(prev => !prev);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    document.addEventListener('toggle-comments-sidebar', handleToggleComments);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('toggle-comments-sidebar', handleToggleComments);
    };
  }, []);

  const {
    localElements,
    realtimeElements,
    useLocalElements,
    revision,
    handleContentChange,
    changeElementType,
    paperRef,
    blockRealtimeSync,
    selectedElementIds,
    handleElementClick,
    deleteSelectedElements,
    setAllElements,
    pushState
  } = useScriptContentState(scriptId, elementsToUse, onContentChange);

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
  const { collaborators } = useCollaboration();
  const { comments, addComment, isLoading: commentsLoading } = useScriptComments(scriptId);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [user, setUser] = useState<any>(null);

  // Mobile action sheet (long-press on an element)
  const [mobileActionSheet, setMobileActionSheet] = useState<{
    elementId: string;
    elementType: ScriptElementType['type'];
    content: string;
  } | null>(null);

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
      const event = new CustomEvent('modify-selection-ai', {
        detail: { text: quoteSelection.text, elementId: quoteSelection.elementId }
      });
      document.dispatchEvent(event);
      clearSelection();
    }
  };

  // Mobile action sheet handlers
  const handleMobileLongPress = useCallback((elementId: string, elementType: ScriptElementType['type'], content: string) => {
    setMobileActionSheet({ elementId, elementType, content });
  }, []);

  const handleMobileModifyWithAI = useCallback((elementId: string, content: string) => {
    const event = new CustomEvent('modify-selection-ai', {
      detail: { text: content, elementId }
    });
    document.dispatchEvent(event);
  }, []);

  const handleMobileQuoteAndComment = useCallback((elementId: string, content: string) => {
    setNewComment(prev => `> "${content.slice(0, 120)}${content.length > 120 ? '…' : ''}"\n\n${prev}`);
    setIsCommentsOpen(true);
  }, []);



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
  const rawScriptElements = useLocalElements ? localElements : realtimeElements;

  // Calculate global scene numbers and indices across the ENTIRE script before pagination
  const scriptElements = useMemo(() => {
    let sceneCount = 0;
    return rawScriptElements.map((element, index) => {
      if (element.type === 'heading') {
        sceneCount++;
      }
      return {
        ...element,
        index,
        sceneNumber: element.type === 'heading' ? sceneCount : undefined,
      };
    });
  }, [rawScriptElements]);

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

      for (const element of rawScriptElements) {
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
      for (const element of rawScriptElements) {
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
      const newElements = rawScriptElements.filter(
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

      // CRITICAL FIX: Reindex positions manually before passing to any state updates.
      // Otherwise setAllElements inside useLocalElementState will physically sort them 
      // BACK to their original positions using the stale `.position` numbers.
      const reindexedElements = newElements.map((el, index) => ({
        ...el,
        position: index
      }));

      // Use the hook function to update local state and persist
      if (reorderElements) {
        // Block realtime sync temporarily to prevent "snap back" due to partial updates
        if (blockRealtimeSync) {
          blockRealtimeSync(5000); // 5 seconds grace period
        }

        // Force local state update IMMEDIATELY with the reindexed elements
        if (setAllElements) {
          setAllElements(reindexedElements);
        }

        await reorderElements(reindexedElements);

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
  }, [rawScriptElements, toast, onContentChange, reorderElements, blockRealtimeSync]);

  // Handle bulk scene deletion from the outline panel
  const handleDeleteScenes = useCallback(async (sceneIds: string[]) => {
    if (!sceneIds.length) return;

    try {
      const sceneIdSet = new Set(sceneIds);

      // Collect ALL element IDs that belong to each selected scene
      // (the heading + all subsequent elements until the next heading)
      const elementIdsToRemove = new Set<string>();
      let inTargetScene = false;

      for (const element of rawScriptElements) {
        if (element.type === 'heading') {
          inTargetScene = sceneIdSet.has(element.id);
        }
        if (inTargetScene) {
          elementIdsToRemove.add(element.id);
        }
      }

      if (elementIdsToRemove.size === 0) {
        console.warn('handleDeleteScenes: no elements found for scenes', sceneIds);
        return;
      }

      const idsToDelete = Array.from(elementIdsToRemove);

      // Compute the remaining elements with re-indexed positions
      const remaining = rawScriptElements
        .filter(el => !elementIdsToRemove.has(el.id))
        .map((el, idx) => ({ ...el, position: idx }));

      // Block realtime sync to prevent DB echoes from overwriting our changes
      if (blockRealtimeSync) blockRealtimeSync(10000);

      // STEP 1: Update local state + global history IMMEDIATELY so the UI
      // reflects the deletion and auto-save won't re-save the ghost elements.
      if (setAllElements) setAllElements(remaining);
      if (pushState) pushState(remaining);

      // STEP 2: Hard-delete the elements from Supabase.
      // We try the dedicated delete RPC first (bypasses RLS with SECURITY DEFINER),
      // then fall back to a direct table delete.
      console.log(`Deleting ${idsToDelete.length} elements from DB...`);
      const { error: rpcDeleteError } = await supabase.rpc('delete_script_elements' as any, {
        p_script_id: scriptId,
        p_element_ids: idsToDelete,
      });

      if (rpcDeleteError) {
        console.warn('delete_script_elements RPC not available, using direct delete:', rpcDeleteError.message);
        // Fallback: direct table delete
        const { error: directDeleteError } = await supabase
          .from('script_elements')
          .delete()
          .in('id', idsToDelete);

        if (directDeleteError) {
          console.error('Direct delete also failed:', directDeleteError);
          throw new Error(`Failed to delete elements from database: ${directDeleteError.message}`);
        }
      }

      console.log(`Successfully deleted ${idsToDelete.length} elements.`);

      // STEP 3: Atomically sync the remaining elements' positions via the bulk RPC.
      // After the FIX_SCENE_DELETION.sql is applied, this RPC will also delete any
      // remaining orphans, making this a true two-layer safety net.
      if (remaining.length > 0) {
        const { error: syncError } = await supabase.rpc('sync_script_elements_bulk' as any, {
          p_script_id: scriptId,
          p_elements: remaining.map(el => ({
            id: el.id,
            type: el.type,
            content: el.content || '',
            position: el.position,
          })),
        });

        if (syncError) {
          // Non-fatal: positions may be slightly off but elements are deleted
          console.warn('Bulk sync after deletion failed (non-fatal):', syncError.message);
        }
      }

      toast({
        title: sceneIds.length === 1 ? 'Scene deleted' : `${sceneIds.length} scenes deleted`,
        description: 'The selected scene(s) have been permanently removed.',
      });

      if (onContentChange) onContentChange();
    } catch (error) {
      console.error('Error deleting scenes:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete the selected scene(s).',
        variant: 'destructive',
      });
    }
  }, [rawScriptElements, scriptId, supabase, toast, onContentChange, blockRealtimeSync, setAllElements, pushState]);

  // === Pagination controls ===
  const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  // Reset to first page when scriptElements change/length shrinks drastically
  useEffect(() => {
    if (currentPage > 0 && (currentPage * PAGE_SIZE >= scriptElements.length)) {
      setCurrentPage(0);
    }
  }, [scriptElements.length, currentPage]);

  // Auto-paginate when the focused element changes (e.g., hitting enter creates a new element on the next page)
  useEffect(() => {
    if (focusedElementId && scriptElements.length > 0) {
      const elementIndex = scriptElements.findIndex(el => el.id === focusedElementId);
      if (elementIndex !== -1) {
        const targetPage = Math.floor(elementIndex / PAGE_SIZE);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
          
          // Optionally scroll to the element once the page switches
          setTimeout(() => {
            const element = document.getElementById(`script-element-${focusedElementId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    }
  }, [focusedElementId, scriptElements]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Ensure view scrolls to the top of the paper when navigating to a new page
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

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
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Structure</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-300" title="Search scenes">
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-naija-green hover:bg-naija-green/10"
                title="Add scene"
                onClick={() => insertScriptElement('heading')}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500" onClick={toggleOutline}>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isOutlineOpen && "rotate-180")} />
              </Button>
            </div>
          </div>
          <ScriptOutlineNav
            elements={scriptElements}
            onElementClick={(id) => {
              scrollToElementId(id);
              if (isMobileView) setIsOutlineOpen(false);
            }}
            onScrollToElement={scrollToElementId}
            onReorder={handleSceneReorder}
            onDeleteScenes={handleDeleteScenes}
            className="flex-1 border-0 bg-transparent"
          />
          {/* Cloud Synced Indicator */}
          <div className="px-3 py-2 border-t border-gray-800/50 flex items-center gap-1.5">
            <Cloud className="h-3 w-3 text-naija-green" />
            <span className="text-[10px] text-gray-600 font-medium">Cloud Synced</span>
          </div>
        </aside>

        {/* Center: Script Canvas */}
        <main className="flex-1 bg-[#121212] relative overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto overscroll-contain flex flex-col items-center scroll-smooth"
            style={{ overscrollBehaviorY: 'contain' }}
          >
            {/* Format Toolbar and Stats stacking on Mobile */}
            <div className="w-full z-40 fixed bottom-0 left-0 md:relative md:sticky md:top-0 bg-[#1A1A1A] md:bg-transparent flex flex-col pointer-events-none md:pointer-events-auto shadow-[0_-10px_20px_rgba(0,0,0,0.4)] md:shadow-none">
              <div className="pointer-events-auto w-full">
                <ScriptFormatToolbar
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onInsertElement={insertScriptElement}
                  onToggleSceneNav={toggleOutline}
                  isSceneNavOpen={isOutlineOpen}
                  activeElementType={activeElementType}
                  hideMobileSwitcher={!!quoteSelection || !!mobileActionSheet || isCommentsOpen}
                  onChangeElementType={(newType) => {
                    if (focusedElementId) {
                      changeElementType(focusedElementId, newType as ScriptElementType['type']);
                    }
                  }}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                />
              </div>
              
              {/* Statistics Footer stacked at the very bottom on mobile */}
              <div className="md:hidden pointer-events-auto w-full bg-[#1E1E1E] border-t border-gray-800 flex justify-center pb-safe">
                <ScriptStatisticsFooter scriptElements={scriptElements} />
              </div>
            </div>

            {/* Floating Navigation Controls */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "fixed top-1/2 -translate-y-1/2 z-50 bg-[#1f2937]/90 backdrop-blur-md border-gray-700 shadow-xl transition-all duration-300",
                isOutlineOpen ? (isMobileView ? "left-[85%]" : "left-[300px]") : "left-0",
                isOutlineOpen ? "rounded-full w-8 h-8 -ml-4" : "rounded-r-md rounded-l-none border-l-0"
              )}
              onClick={toggleOutline}
              title={isOutlineOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {isOutlineOpen ? <PanelLeftClose className="h-4 w-4 text-gray-300" /> : <PanelLeft className="h-4 w-4 text-gray-300" />}
            </Button>

            {totalPages !== undefined && totalPages > 1 && (
              <div className="fixed bottom-6 right-2 md:bottom-8 md:right-8 z-50 flex flex-col gap-2 scale-75 md:scale-100 origin-bottom-right opacity-50 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-[#1f2937]/80 backdrop-blur-md rounded-full border border-gray-700 shadow-lg md:shadow-xl">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Previous Page"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono text-gray-300 min-w-[3ch] text-center">
                    {currentPage + 1}/{totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Next Page"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="py-0 md:py-10 px-0 md:px-4 flex flex-col items-center w-full pb-44 md:pb-32">
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
                        collaborators={collaborators}
                        paperRef={paperRef}
                        onContentChange={handleContentChange}
                        onElementFocus={handleElementFocusInternal}
                        scriptId={scriptId}
                        updateElement={updateElement}
                        changeElementType={changeElementType}
                        revision={revision}
                        selectedElementIds={selectedElementIds}
                        onElementClick={handleElementClick}
                        onLongPress={isMobileView ? handleMobileLongPress : undefined}
                      />

                      {totalPages > 1 && (
                        <div className="mt-20 border-t border-gray-100 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                          <span>PAGE {currentPage + 1} OF {totalPages}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <ScriptLoadingState isLoaded={isLoaded} loadError={loadError} />
                  )}
                </ScriptPaper>
              </div>

              <div className="hidden md:block">
                <ScriptStatisticsFooter scriptElements={scriptElements} />
              </div>
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

      {/* Mobile long-press action sheet */}
      <MobileElementActionSheet
        isOpen={!!mobileActionSheet}
        elementId={mobileActionSheet?.elementId ?? null}
        elementType={mobileActionSheet?.elementType ?? null}
        elementContent={mobileActionSheet?.content ?? ''}
        onClose={() => setMobileActionSheet(null)}
        onModifyWithAI={handleMobileModifyWithAI}
        onQuoteAndComment={handleMobileQuoteAndComment}
      />

      {/* Floating Quote Button (desktop text-selection) */}
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
