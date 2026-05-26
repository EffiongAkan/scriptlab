
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { ChevronRight, ChevronDown, FileText, Users, MapPin, Clock, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ScriptOutlineNavProps {
  elements: ScriptElementType[];
  onElementClick?: (elementId: string) => void;
  onScrollToElement?: (elementId: string) => void;
  onReorder?: (sceneId: string, newPosition: number) => void;
  onDeleteScenes?: (sceneIds: string[]) => void;
  className?: string;
}

export const ScriptOutlineNav = ({ elements, onElementClick, onScrollToElement, onReorder, onDeleteScenes, className }: ScriptOutlineNavProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Process elements into outline structure
  const outline = React.useMemo(() => {
    const scenes: Array<{
      id: string;
      heading: string;
      elements: ScriptElementType[];
      characters: Set<string>;
      wordCount: number;
    }> = [];

    let currentScene: typeof scenes[0] | null = null;

    elements.forEach((element) => {
      if (element.type === 'heading') {
        // Start new scene
        currentScene = {
          id: element.id,
          heading: element.content,
          elements: [element],
          characters: new Set(),
          wordCount: element.content.split(/\s+/).length
        };
        scenes.push(currentScene);
      } else if (currentScene) {
        // Add to current scene
        currentScene.elements.push(element);
        currentScene.wordCount += element.content.split(/\s+/).length;

        if (element.type === 'character') {
          currentScene.characters.add(element.content.trim().toUpperCase());
        }
      }
    });

    return scenes;
  }, [elements]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSceneSelection = (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedSceneIds);
    if (next.has(sceneId)) {
      next.delete(sceneId);
    } else {
      next.add(sceneId);
    }
    setSelectedSceneIds(next);
    setShowDeleteConfirm(false);
  };

  const selectAll = () => {
    setSelectedSceneIds(new Set(outline.map(s => s.id)));
    setShowDeleteConfirm(false);
  };

  const clearSelection = () => {
    setSelectedSceneIds(new Set());
    setShowDeleteConfirm(false);
  };

  const handleDeleteSelected = () => {
    if (showDeleteConfirm) {
      if (onDeleteScenes) {
        onDeleteScenes(Array.from(selectedSceneIds));
      }
      setSelectedSceneIds(new Set());
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const scrollToElement = (elementId: string) => {
    if (onScrollToElement) {
      onScrollToElement(elementId);
      return;
    }

    let element = document.getElementById(elementId);
    if (!element) {
      element = document.querySelector(`[data-element-id="${elementId}"]`);
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-[#00BFA5]', 'ring-offset-2');
      setTimeout(() => {
        element?.classList.remove('ring-2', 'ring-[#00BFA5]', 'ring-offset-2');
      }, 2000);
    }

    if (onElementClick) {
      onElementClick(elementId);
    }
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (e.clientY < midY) {
      setDropPosition('top');
    } else {
      setDropPosition('bottom');
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    if (onReorder) {
      const draggedScene = outline[draggedIndex];
      if (draggedScene) {
        let newIndex = dropIndex;
        if (dropPosition === 'bottom') {
          newIndex = dropIndex + 1;
        }
        onReorder(draggedScene.id, newIndex);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const getTotalStats = () => {
    const totalScenes = outline.length;
    const totalCharacters = new Set(outline.flatMap(scene => Array.from(scene.characters))).size;
    const totalWords = outline.reduce((sum, scene) => sum + scene.wordCount, 0);
    const estimatedPages = Math.ceil(totalWords / 250);

    return { totalScenes, totalCharacters, totalWords, estimatedPages };
  };

  const stats = getTotalStats();

  return (
    <div className={cn("flex flex-col h-full bg-transparent text-gray-400", className)}>
      {/* Multi-select action bar */}
      {selectedSceneIds.size > 0 && (
        <div className={cn(
          "mx-2 mt-2 rounded-lg px-3 py-2 flex items-center justify-between gap-2 border transition-colors",
          showDeleteConfirm
            ? "bg-red-950/60 border-red-700/60"
            : "bg-white/5 border-white/10"
        )}>
          <div className="flex items-center gap-2 min-w-0">
            {showDeleteConfirm ? (
              <span className="text-[10px] font-bold text-red-400 leading-tight">
                Delete {selectedSceneIds.size} scene{selectedSceneIds.size > 1 ? 's' : ''}? This cannot be undone.
              </span>
            ) : (
              <>
                <CheckSquare className="h-3 w-3 text-[#00BFA5] flex-shrink-0" />
                <span className="text-[10px] font-bold text-gray-300 truncate">
                  {selectedSceneIds.size} scene{selectedSceneIds.size > 1 ? 's' : ''} selected
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!showDeleteConfirm && selectedSceneIds.size < outline.length && (
              <button
                onClick={selectAll}
                className="text-[9px] font-bold text-[#00BFA5] hover:text-[#00BFA5]/80 uppercase tracking-wide px-1"
              >
                All
              </button>
            )}
            {showDeleteConfirm ? (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[9px] font-bold text-gray-400 hover:text-gray-200 uppercase tracking-wide px-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wide px-1"
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wide px-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
                <button
                  onClick={clearSelection}
                  className="p-0.5 text-gray-600 hover:text-gray-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {outline.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              <p className="text-[10px] uppercase tracking-widest font-bold">No scenes yet</p>
            </div>
          ) : (
            outline.map((scene, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const isExpanded = expandedSections.has(scene.id);
              const isSelected = selectedSceneIds.has(scene.id);

              return (
                <div
                  key={scene.id}
                  className={cn(
                    "group transition-all relative border rounded-lg mb-1",
                    isDragging && "opacity-20",
                    isDragOver && dropPosition === 'top' && "border-t-[#00BFA5]",
                    isDragOver && dropPosition === 'bottom' && "border-b-[#00BFA5]",
                    isSelected
                      ? "bg-[#00BFA5]/10 border-[#00BFA5]/40"
                      : isExpanded
                        ? "bg-white/5 border-white/5"
                        : "border-transparent hover:bg-white/5"
                  )}
                  draggable={!isSelected}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center p-2 gap-2 cursor-pointer" onClick={() => toggleSection(scene.id)}>
                    {/* Checkbox — always visible when any scene is selected, else on hover */}
                    <button
                      onClick={(e) => toggleSceneSelection(scene.id, e)}
                      className={cn(
                        "flex-shrink-0 transition-opacity",
                        selectedSceneIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                      aria-label={isSelected ? "Deselect scene" : "Select scene"}
                    >
                      {isSelected
                        ? <CheckSquare className="h-3.5 w-3.5 text-[#00BFA5]" />
                        : <Square className="h-3.5 w-3.5 text-gray-600 hover:text-gray-300" />
                      }
                    </button>
                    <ChevronRight className={cn("h-3 w-3 transition-transform text-gray-600 flex-shrink-0", isExpanded && "rotate-90 text-[#00BFA5]")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between pointer-events-none">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Scene {index + 1}</span>
                        <span className="text-[8px] text-gray-600 group-hover:text-[#00BFA5]/70">{scene.wordCount} w</span>
                      </div>
                      <div className={cn("text-[11px] truncate font-semibold tracking-tight leading-tight mt-0.5", isExpanded ? "text-gray-100" : "text-gray-400 group-hover:text-gray-200")}>
                        {scene.heading || "UNTITLED SCENE"}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pl-6 pr-2 pb-2 space-y-1 bg-black/10 rounded-b-lg">
                      {scene.elements.slice(1).map((element) => (
                        <div
                          key={element.id}
                          className="flex items-center gap-2 group/item cursor-pointer text-[10px] py-1 hover:text-gray-100 transition-colors"
                          onClick={() => scrollToElement(element.id)}
                        >
                          <div className={cn(
                            "w-1 h-1 rounded-full flex-shrink-0",
                            element.type === 'character' ? "bg-[#00BFA5]" :
                              element.type === 'heading' ? "bg-white" : "bg-gray-700"
                          )} />
                          <span className="truncate flex-1 text-gray-500 group-hover/item:text-gray-300">
                            {element.type === 'character' ? <span className="text-[#00BFA5]/80 mr-1 font-bold uppercase">{element.content}</span> : element.content}
                          </span>
                        </div>
                      ))}

                      {scene.characters.size > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
                          {Array.from(scene.characters).slice(0, 3).map(char => (
                            <span key={char} className="text-[7px] bg-[#00BFA5]/10 text-[#00BFA5]/80 px-1 rounded uppercase font-bold border border-[#00BFA5]/10">
                              {char}
                            </span>
                          ))}
                          {scene.characters.size > 3 && <span className="text-[7px] text-gray-600">+{scene.characters.size - 3}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-gray-800 bg-black/30 text-[8px] font-bold text-gray-600 uppercase tracking-[0.1em] flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-2 h-2" />
          <span>{outline.length} SCENES</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-2 h-2" />
          <span>{stats.estimatedPages} PAGES</span>
        </div>
      </div>
    </div>
  );
};
