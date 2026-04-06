
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { ScriptToolbar } from "@/components/script-editor/ScriptToolbar";
import { EditorTabs } from "@/components/script-editor/EditorTabs";
import { EditorSidebar } from "@/components/script-editor/EditorSidebar";
import { ScriptElementsSidebar } from "@/components/script-editor/ScriptElementsSidebar";
import { FloatingPanel } from "@/components/common/FloatingPanel";
import { AIPromptBox } from "@/components/script-editor/AIPromptBox";
import { FindReplaceDialog } from "@/components/script-editor/FindReplaceDialog";
import { useScriptShortcuts } from "@/hooks/useScriptShortcuts";
import { useFindReplace } from "@/hooks/useFindReplace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScriptSave } from "@/hooks/useScriptSave";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useScriptHistory } from "@/contexts/ScriptHistoryContext";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseScriptElements } from "@/utils/scriptElementParser";
import { NetworkStatusIndicator } from "@/components/script-editor/NetworkStatusIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function EditorContent() {
  const [title, setTitle] = useState("UNTITLED SCREENPLAY");
  const { scriptId } = useParams<{ scriptId: string }>();
  const { toast } = useToast();
  
  // Activate background sync
  useOfflineSync();

  const { saveScript, isSaving, lastSavedAt } = useScriptSave(scriptId || '');
  const { elements: loadedElements, scriptData, isLoaded, updateElement, reloadElements } = useScriptContent(scriptId);
  const [activeTab, setActiveTab] = useState<string>("write");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { elements: historyElements, undo, redo, canUndo, canRedo, pushState, initState } = useScriptHistory();
  const [characters, setCharacters] = useState<any[]>([]);

  const [showFloatingElementsPanel, setShowFloatingElementsPanel] = useState(true);
  const [showAIPromptBox, setShowAIPromptBox] = useState(false);
  const [aiInitialSelection, setAiInitialSelection] = useState<{ text: string; elementId?: string } | null>(null);

  // Find and Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showReplaceMode, setShowReplaceMode] = useState(false);
  const findReplace = useFindReplace(historyElements || []);

  useScriptShortcuts();

  // Keyboard shortcuts for find/replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + F: Open Find
      if (modKey && e.key === 'f') {
        e.preventDefault();
        setShowReplaceMode(false);
        setShowFindReplace(true);
      }

      // Cmd/Ctrl + H: Open Find & Replace
      if (modKey && e.key === 'h') {
        e.preventDefault();
        setShowReplaceMode(true);
        setShowFindReplace(true);
      }

      // Escape: Close dialog
      if (e.key === 'Escape' && showFindReplace) {
        setShowFindReplace(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFindReplace]);

  // Listen for custom event from ScriptToolbar to toggle AI Prompt Box
  useEffect(() => {
    const handleToggleAI = () => {
      setAiInitialSelection(null); // Clear previous selection when manual toggle
      setShowAIPromptBox(prev => !prev);
    };

    const handleModifyAI = (e: any) => {
      const { text, elementId } = e.detail;
      setAiInitialSelection({ text, elementId });
      setShowAIPromptBox(true);
    };

    document.addEventListener('toggle-ai-prompt', handleToggleAI);
    document.addEventListener('modify-selection-ai', handleModifyAI);
    return () => {
      document.removeEventListener('toggle-ai-prompt', handleToggleAI);
      document.removeEventListener('modify-selection-ai', handleModifyAI);
    };
  }, []);

  // Validate scriptId
  const isValidUuid = (id?: string) => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // LOAD THE SCRIPT TITLE INITIALLY
  useEffect(() => {
    if (!scriptId) return;

    const fetchScriptTitle = async () => {
      try {
        if (!isValidUuid(scriptId)) return;
        const { data, error } = await supabase
          .from('scripts')
          .select('title')
          .eq('id', scriptId)
          .maybeSingle();
        if (error) {
          console.error("Error fetching script title:", error.message || error);
          toast({
            title: "Load Failed",
            description: "Unable to load script title",
            variant: "destructive"
          });
          return;
        }
        if (data && data.title) setTitle(data.title);
      } catch (error: any) {
        console.error("Error fetching script title:", error && error.message ? error.message : error);
        toast({
          title: "Load Failed",
          description: "An unexpected error occurred loading script title.",
          variant: "destructive"
        });
      }
    };
    fetchScriptTitle();
  }, [scriptId, toast]);

  // FETCH CHARACTERS
  useEffect(() => {
    if (!scriptId) return;

    const fetchCharacters = async () => {
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('script_id', scriptId);

        if (error) {
          console.error("Error fetching characters:", error);
          return;
        }

        if (data) setCharacters(data);
      } catch (error) {
        console.error("Error in fetchCharacters:", error);
      }
    };

    fetchCharacters();
  }, [scriptId]);

  // On first load, initialize history with loaded elements
  useEffect(() => {
    if (isLoaded && loadedElements) {
      initState(loadedElements); // Initialize history with fresh elements
    }
    // eslint-disable-next-line
  }, [isLoaded, loadedElements]);

  // Save current state to history when 'historyElements' change (for undo/redo consistency)
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [historyElements]);

  // On save, just update last saved status—DON'T clear or reset elements/histories
  const handleSave = useCallback(async () => {
    if (!scriptId) {
      toast({
        title: "Error",
        description: "Cannot save: No script ID provided",
        variant: "destructive"
      });
      return;
    }
    if (!historyElements) {
      toast({
        title: "Error",
        description: "Cannot save: Script content not loaded correctly",
        variant: "destructive"
      });
      return;
    }
    try {
      const scriptElements = Array.isArray(historyElements) ? historyElements : [];
      const success = await saveScript(scriptElements, title);
      if (success) {
        setHasUnsavedChanges(false);
        // Do NOT clear or re-init elements/history here—that wipes out your draft!
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save script. Please try again.",
        variant: "destructive"
      });
    }
  }, [scriptId, historyElements, saveScript, title, toast]);

  const handleUndo = useCallback(() => {
    undo();
    setHasUnsavedChanges(true);
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    setHasUnsavedChanges(true);
  }, [redo]);

  if (!scriptId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-2 shrink-0">
        <ScriptToolbar
          scriptId={scriptId}
          title={title}
          onSave={handleSave}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onTitleChange={(newTitle) => {
            setTitle(newTitle);
            setHasUnsavedChanges(true); // Mark as unsaved so user knows to save
          }}
          onRepairOrder={async () => {
            try {
              toast({ title: "Repairing...", description: "Re-indexing script elements..." });
              const { error } = await supabase.rpc('repair_script_order_smart' as any, { p_script_id: scriptId });
              if (error) throw error;
              toast({ title: "Fixed!", description: "Script order repaired. Reloading..." });
              setTimeout(() => window.location.reload(), 1000);
            } catch (e: any) {
              toast({ title: "Error", description: e.message, variant: "destructive" });
            }
          }}
        />
      </div>


      {/* Find and Replace Dialog */}
      {showFindReplace && (
        <FindReplaceDialog
          open={showFindReplace}
          onClose={() => setShowFindReplace(false)}
          searchTerm={findReplace.searchTerm}
          replaceTerm={findReplace.replaceTerm}
          caseSensitive={findReplace.caseSensitive}
          wholeWord={findReplace.wholeWord}
          currentMatchIndex={findReplace.currentMatchIndex}
          totalMatches={findReplace.totalMatches}
          onSearchChange={findReplace.setSearchTerm}
          onReplaceChange={findReplace.setReplaceTerm}
          onCaseSensitiveChange={findReplace.setCaseSensitive}
          onWholeWordChange={findReplace.setWholeWord}
          onFindNext={findReplace.findNext}
          onFindPrevious={findReplace.findPrevious}
          onReplace={() => {
            const replaced = findReplace.replaceCurrent((elementId, newContent) => {
              // Use a fresh copy of current elements
              const currentElements = [...(historyElements || [])];
              const updatedElements = currentElements.map(el =>
                el.id === elementId ? { ...el, content: newContent } : el
              );
              pushState(updatedElements);
              setHasUnsavedChanges(true);
            });
            if (replaced) {
              toast({
                title: "Replaced",
                description: "1 replacement made"
              });
            }
          }}
          onReplaceAll={() => {
            // Logic to accumulate ALL replacements before pushing state once
            let updatedElements = [...(historyElements || [])];

            const count = findReplace.replaceAll((elementId, newContent) => {
              updatedElements = updatedElements.map(el =>
                el.id === elementId ? { ...el, content: newContent } : el
              );
            });

            if (count > 0) {
              pushState(updatedElements);
              setHasUnsavedChanges(true);
              toast({
                title: "Replaced All",
                description: `${count} replacement(s) made`
              });
            } else {
              toast({
                title: "No matches",
                description: "No instances found to replace"
              });
            }
          }}
          showReplace={showReplaceMode}
        />
      )}

      {/* AI Prompt Box */}
      {showAIPromptBox && (
        <div className="fixed bottom-4 right-4 w-[600px] md:w-[700px] max-w-[90vw] z-[200]">
          <AIPromptBox
            onClose={() => setShowAIPromptBox(false)}
            onApply={async (content, options) => {
              console.log("Applying AI content. Full replace:", options?.replaceFull);

              try {
                // Parse the generated content into script elements
                const parsedElements = parseScriptElements(content);

                if (parsedElements && parsedElements.length > 0) {
                  // Get the current elements
                  const currentElements = historyElements || [];
                  let updatedElements = [...currentElements];
                  let appliedCount = 0;

                  // NEW LOGIC: Full Script Replacement
                  if (options?.replaceFull) {
                    console.log("Deep Edit: Replacing entire script.");
                    updatedElements = parsedElements;
                    appliedCount = parsedElements.length;
                  } 
                  // NEW LOGIC: In-place replacement for specific selection
                  else if (aiInitialSelection?.elementId) {
                    console.log(`Modifying specific element: ${aiInitialSelection.elementId}`);
                    // Find index of element to replace
                    const targetIndex = currentElements.findIndex(e => e.id === aiInitialSelection.elementId);
                    const targetElement = currentElements[targetIndex];

                    if (targetIndex !== -1) {
                      let elementsToRemove = 1;

                      // If the selected element is a heading, we replace the ENTIRE SCENE
                      if (targetElement.type === 'heading') {
                        console.log(`Heading selected (${targetElement.content}). Finding scene boundaries for replacement.`);
                        // Find the index of the next heading or end of script
                        let nextHeadingIndex = currentElements.findIndex((e, i) => i > targetIndex && e.type === 'heading');
                        if (nextHeadingIndex !== -1) {
                          elementsToRemove = nextHeadingIndex - targetIndex;
                        } else {
                          // It's the last scene
                          elementsToRemove = currentElements.length - targetIndex;
                        }
                        console.log(`Replacing scene: removing ${elementsToRemove} elements starting at index ${targetIndex}`);
                      } else {
                        console.log(`In-place replacement for single ${targetElement.type} element`);
                      }

                      // Ensure parsed elements have correct new position relative to insertion
                      const positionedParsedElements = parsedElements.map((el, i) => ({
                        ...el,
                        position: targetIndex + i
                      }));

                      // Replace at index (remove N, insert M)
                      updatedElements.splice(targetIndex, elementsToRemove, ...positionedParsedElements);
                      appliedCount = parsedElements.length;
                    } else {
                      console.warn(`Target element ${aiInitialSelection.elementId} not found, falling back to smart merge`);
                      // Fallback to smart merge below if element not found (rare race condition)
                    }
                  }

                  // EXISTING LOGIC: Smart Merge (if no selection or fallback)
                  if (appliedCount === 0) {
                    const hasSceneHeadings = parsedElements.some(e => e.type === 'heading');

                    if (hasSceneHeadings) {
                      console.log("AI output contains scene headings, attempting smart merge...");

                      // Group elements by scene
                      const aiScenes: { heading: string, elements: typeof parsedElements }[] = [];
                      let currentAIScene: { heading: string, elements: typeof parsedElements } | null = null;

                      parsedElements.forEach(el => {
                        if (el.type === 'heading') {
                          if (currentAIScene) aiScenes.push(currentAIScene);
                          currentAIScene = { heading: el.content.toUpperCase().trim(), elements: [el] };
                        } else if (currentAIScene) {
                          currentAIScene.elements.push(el);
                        }
                      });
                      if (currentAIScene) aiScenes.push(currentAIScene);

                      if (aiScenes.length > 0) {
                        // Process each AI scene
                        aiScenes.forEach(aiScene => {
                          // Find if this scene exists in the current script
                          const existingHeadingIndex = currentElements.findIndex(e =>
                            e.type === 'heading' && e.content.toUpperCase().trim() === aiScene.heading
                          );

                          if (existingHeadingIndex !== -1) {
                            console.log(`Matching scene found: ${aiScene.heading}. Replacing content...`);

                            // Find the end of the existing scene
                            let existingSceneEnd = currentElements.findIndex((e, i) => i > existingHeadingIndex && e.type === 'heading');
                            if (existingSceneEnd === -1) existingSceneEnd = currentElements.length;

                            // Replace the slice
                            updatedElements.splice(existingHeadingIndex, existingSceneEnd - existingHeadingIndex, ...aiScene.elements);
                            appliedCount += aiScene.elements.length;
                          } else {
                            // Not found, append this scene
                            console.log(`Scene ${aiScene.heading} not found, appending to bottom.`);
                            updatedElements.push(...aiScene.elements);
                            appliedCount += aiScene.elements.length;
                          }
                        });
                      } else {
                        // Fallback: AI returned metadata but no headings properly detected
                        updatedElements = [...currentElements, ...parsedElements];
                        appliedCount = parsedElements.length;
                      }
                    } else {
                      // No headings, just append to the bottom
                      updatedElements = [...currentElements, ...parsedElements];
                      appliedCount = parsedElements.length;
                    }
                  }

                  // Recalculate all positions to ensure they are sequential
                  const elementsWithCorrectPositions = updatedElements.map((el, idx) => ({
                    ...el,
                    script_id: scriptId || '',
                    position: idx
                  }));

                  // Push to history
                  pushState(elementsWithCorrectPositions);
                  setHasUnsavedChanges(true);

                  toast({
                    title: "Applied",
                    description: `Successfully merged AI content. Total ${appliedCount} element(s) updated/added.`
                  });

                  // Automatically save
                  const saveSuccess = await saveScript(elementsWithCorrectPositions, title);

                  if (saveSuccess) {
                    console.log("AI content saved successfully to database");
                    setHasUnsavedChanges(false);
                  } else {
                    console.warn("Auto-save failed, but content is in local state");
                    toast({
                      title: "Save Reminder",
                      description: "Content applied locally. Please manually save to persist changes.",
                      variant: "default"
                    });
                  }
                } else {
                  toast({
                    title: "Error",
                    description: "Could not parse AI suggestions. Please try again.",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                console.error("Error applying AI content:", error);
                toast({
                  title: "Error",
                  description: "An unexpected error occurred while applying AI content.",
                  variant: "destructive"
                });
              }
            }}
            scriptContext={(() => {
              // Priority 1: Full Script Context (Full Rewrites)
              // If we are in "Full Rewrite" mode (we don't have a state for it here yet, 
              // but we can pass the whole script if no selection is made, or just always 
              // provide a more comprehensive context if available)
              const allElements = historyElements || [];
              
              if (aiInitialSelection?.elementId) {
                const idx = allElements.findIndex(e => e.id === aiInitialSelection.elementId);
                if (idx !== -1) {
                  const start = Math.max(0, idx - 20);
                  const end = Math.min(allElements.length, idx + 20);
                  return `Title: ${title}\nContext Around Selection:\n${allElements.slice(start, end).map(e => `[${e.type.toUpperCase()}] ${e.content}`).join('\n')}`;
                }
              }

              // Default to providing as much context as possible (up to ~100 elements for safety)
              const contextElements = allElements.length > 100 ? allElements.slice(-100) : allElements;
              return `Title: ${title}\n${allElements.length > 100 ? 'Recent ' : 'Full '}Script Content:\n${contextElements.map(e => `[${e.type.toUpperCase()}] ${e.content}`).join('\n')}`;
            })()}
            scriptData={scriptData || undefined}
            characters={characters}
            initialSelection={aiInitialSelection || undefined}
          />
        </div>
      )}

      {/* Editor canvas */}
      <div className="w-full flex-1 overflow-hidden min-h-0">
        <EditorTabs
          scriptId={scriptId}
          title={title}
          elements={historyElements || []}
          onTitleChange={e => { setTitle(e.target.value); setHasUnsavedChanges(true); }}
          onContentChange={() => setHasUnsavedChanges(true)}
          onApplySuggestion={() => { }}
          onApplyAllSuggestions={() => { }}
          onImplementAllSuggestions={async (updatedElements) => {
            // Re-index positions and attach scriptId
            const positioned = updatedElements.map((el, idx) => ({
              ...el,
              script_id: scriptId || '',
              position: idx,
            }));
            pushState(positioned);
            setHasUnsavedChanges(true);
            // Auto-save
            const ok = await saveScript(positioned, title);
            if (ok) setHasUnsavedChanges(false);
          }}
          onTabChange={t => setActiveTab(t)}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          hasUnsavedChanges={hasUnsavedChanges}
          genre={scriptData?.genre}
          language={scriptData?.language}
          synopsis={scriptData?.description === 'null' || scriptData?.description === 'undefined' ? undefined : scriptData?.description}
          industry={scriptData?.film_industry === 'null' || scriptData?.film_industry === 'undefined' ? undefined : scriptData?.film_industry}
        />
        <NetworkStatusIndicator />
      </div>
    </div>

  );
}
