
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { SimpleScriptElement } from "../SimpleScriptElement";
import { ScriptElementType, useScriptContent } from "@/hooks/useScriptContent";
import { Collaborator } from "@/types/collaboration";
import CollaboratorCursor from "../CollaboratorCursor";
import { cn } from "@/lib/utils";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { useToast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { FileText, Film, User, MessageSquare, Type, ArrowRight } from 'lucide-react';

interface ScriptElementListProps {
  scriptElements: ScriptElementType[];
  collaborators: Collaborator[];
  paperRef: React.RefObject<HTMLDivElement>;
  onContentChange: (id: string, content: string) => void;
  onElementFocus: (elementId: string) => void;
  scriptId: string;
  updateElement: (id: string, updates: Partial<ScriptElementType>) => Promise<void>;
  changeElementType?: (id: string, type: ScriptElementType['type']) => Promise<void>;
  revision?: number;
  selectedElementIds?: Set<string>;
  onElementClick?: (id: string, event: React.MouseEvent) => void;
}

export const ScriptElementList = ({
  scriptElements,
  collaborators,
  paperRef,
  onContentChange,
  onElementFocus,
  scriptId,
  updateElement,
  changeElementType,
  revision,
  selectedElementIds,
  onElementClick
}: ScriptElementListProps) => {
  const previousElementsLengthRef = useRef(0);
  const newElementRef = useRef<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRefsRef = useRef<Map<string, HTMLElement>>(new Map());
  const { insertScriptElement } = useScriptEditor();
  const { toast } = useToast();

  // Memoize collaborator cursor positions for performance
  const collaboratorCursors = useMemo(() => {
    return collaborators
      .filter(c => c.status === 'online' && c.cursor)
      .map((collaborator, index) => {
        const elementWithCursor = elementRefsRef.current.get(collaborator.cursor?.elementId || '');
        if (!elementWithCursor || !paperRef.current) return null;

        const rect = elementWithCursor.getBoundingClientRect();
        const containerRect = paperRef.current.getBoundingClientRect();

        // Generate consistent color based on collaborator's ID
        const colors = ['#FF5733', '#33A8FF', '#33FF57', '#8C33FF', '#FF33A8', '#FFB533', '#FF3383'];
        const colorIndex = collaborator.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[colorIndex % colors.length];

        return {
          id: collaborator.id,
          username: collaborator.username,
          color,
          position: {
            top: rect.top - containerRect.top + 24,
            left: rect.left - containerRect.left + (collaborator.cursor?.position || 0) * 8
          }
        };
      })
      .filter(Boolean);
  }, [collaborators, paperRef]);

  // Handle creating a new element when Enter is pressed
  const handleEnterPress = useCallback((currentElementId: string) => {
    // Create new action element (most common type in screenplays)
    insertScriptElement('action', '');
  }, [insertScriptElement]);

  // Handle element type change
  const handleTypeChange = useCallback(async (elementId: string, newType: ScriptElementType['type']) => {
    try {
      const element = scriptElements.find(el => el.id === elementId);
      if (!element) return;

      const oldType = element.type;

      // Update the logic to favor changeElementType to support immediate local updates
      if (changeElementType) {
        await changeElementType(elementId, newType);
      } else {
        await updateElement(elementId, { type: newType });
      }

      // Note: History will be automatically updated by the debounced effect in useScriptContentState
      // No need to manually push state here

      // Show success toast
      toast({
        title: 'Element Type Changed',
        description: `Changed from ${oldType} to ${newType}`,
      });
    } catch (error) {
      console.error('Error changing element type:', error);
      toast({
        title: 'Error',
        description: 'Failed to change element type',
        variant: 'destructive',
      });
    }
  }, [updateElement, scriptElements, toast]);

  // Optimized element tracking for new additions
  useEffect(() => {
    if (scriptElements.length > previousElementsLengthRef.current && scriptElements.length > 0) {
      const lastElement = scriptElements[scriptElements.length - 1];
      newElementRef.current = lastElement?.id || null;

      // Auto-focus the new element with improved timing
      const focusTimeout = setTimeout(() => {
        const newElement = document.getElementById(`script-element-${newElementRef.current}`);
        if (newElement) {
          const textarea = newElement.querySelector('textarea');
          if (textarea) {
            textarea.focus();
            // Scroll into view smoothly
            newElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }, 150);

      // Reset animation flag
      const resetTimeout = setTimeout(() => {
        newElementRef.current = null;
      }, 1000);

      return () => {
        clearTimeout(focusTimeout);
        clearTimeout(resetTimeout);
      };
    }

    previousElementsLengthRef.current = scriptElements.length;
  }, [scriptElements.length]);

  // Performance optimization: Intersection Observer for viewport-based rendering
  useEffect(() => {
    if (!paperRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            element.classList.add('in-viewport');
          } else {
            element.classList.remove('in-viewport');
          }
        });
      },
      {
        root: paperRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [paperRef]);

  // Callback to register element refs for cursor positioning
  const registerElementRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      elementRefsRef.current.set(id, element);
      // Add to intersection observer
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      elementRefsRef.current.delete(id);
    }
  }, []);

  // Optimized content change handler with debouncing
  const debouncedContentChange = useCallback(
    (() => {
      const timeouts = new Map<string, NodeJS.Timeout>();

      return (id: string, content: string) => {
        // Clear existing timeout for this element
        if (timeouts.has(id)) {
          clearTimeout(timeouts.get(id)!);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
          onContentChange(id, content);
          timeouts.delete(id);
        }, 300); // 300ms debounce

        timeouts.set(id, timeout);
      };
    })(),
    [onContentChange]
  );

  // Scene tracking for better organization
  const sceneElements = useMemo(() => {
    let sceneCount = 0;
    return scriptElements.map((element, index) => {
      if (element.type === 'heading') {
        sceneCount++;
      }
      return {
        ...element,
        sceneNumber: element.type === 'heading' ? sceneCount : null,
        index
      };
    });
  }, [scriptElements]);

  return (
    <>
      {/* Scene information header */}
      {sceneElements.length > 0 && (
        <div className="text-center mb-8 font-mono">
          <div className="uppercase font-bold text-sm">SCREENPLAY</div>
          <div className="mt-1 text-xs text-gray-600">
            {sceneElements.filter(el => el.type === 'heading').length} scenes • {sceneElements.length} elements
          </div>
        </div>
      )}

      {/* Render optimized script elements */}
      {sceneElements.map((element) => {
        const isNewElement = newElementRef.current === element.id;

        const typeConfig: Record<ScriptElementType['type'], { label: string; icon: React.ReactNode; description: string }> = {
          heading: { label: 'Scene Heading', icon: <Film className="w-4 h-4" />, description: 'INT./EXT. LOCATION - TIME' },
          action: { label: 'Action', icon: <FileText className="w-4 h-4" />, description: 'Scene description or action' },
          character: { label: 'Character', icon: <User className="w-4 h-4" />, description: 'CHARACTER NAME' },
          dialogue: { label: 'Dialogue', icon: <MessageSquare className="w-4 h-4" />, description: 'Character dialogue' },
          parenthetical: { label: 'Parenthetical', icon: <Type className="w-4 h-4" />, description: '(action or emotion)' },
          transition: { label: 'Transition', icon: <ArrowRight className="w-4 h-4" />, description: 'CUT TO: / FADE OUT:' }
        };

        return (
          <ContextMenu key={element.id}>
            <ContextMenuTrigger asChild>
              <div
                id={`script-element-${element.id}`}
                ref={(el) => registerElementRef(element.id, el)}
                onClick={(e) => {
                  // Only trigger selection if clicking the container (margin areas) or if using modifiers
                  // If clicking the textarea/content, we let focus handle it unless modifier keys are down
                  if (onElementClick) {
                    onElementClick(element.id, e as unknown as React.MouseEvent);
                  }
                }}
                className={cn(
                  "transition-all duration-200 relative group px-2 rounded-md", // Added padding and rounded corners for selection highlight
                  isNewElement && "script-element-fade-in animate-pulse",
                  element.type === 'heading' && "relative mt-8 first:mt-0",
                  selectedElementIds?.has(element.id) && "bg-blue-100/10 ring-2 ring-blue-500/50" // Selection Highlight
                )}
                data-element-id={element.id}
                data-element-type={element.type}
              >
                {/* Enhanced line numbers with scene indicators */}
                <div className="hidden sm:flex absolute -left-16 text-gray-400 text-xs select-none pt-1 flex-col items-end">
                  <span>{element.index + 1}</span>
                  {element.sceneNumber && (
                    <span className="text-blue-500 font-bold text-[10px]">S{element.sceneNumber}</span>
                  )}
                </div>

                {/* Visual indicator for element types */}
                <div className="absolute -left-2 top-1 w-1 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={cn(
                    "w-full h-full rounded-full",
                    element.type === 'heading' && "bg-blue-500",
                    element.type === 'character' && "bg-green-500",
                    element.type === 'dialogue' && "bg-yellow-500",
                    element.type === 'action' && "bg-gray-500",
                    element.type === 'parenthetical' && "bg-purple-500",
                    element.type === 'transition' && "bg-red-500"
                  )} />
                </div>

                <SimpleScriptElement
                  id={element.id}
                  type={element.type}
                  content={element.content}
                  revision={revision}
                  onChange={debouncedContentChange}
                  onFocus={() => onElementFocus(element.id)}
                  onEnterPress={handleEnterPress}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuLabel>Change Element Type</ContextMenuLabel>
              <ContextMenuSeparator />
              {Object.entries(typeConfig).map(([type, config]) => (
                <ContextMenuItem
                  key={type}
                  onClick={() => handleTypeChange(element.id, type as ScriptElementType['type'])}
                  disabled={type === element.type}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    {config.icon}
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">{config.description}</span>
                    </div>
                    {type === element.type && (
                      <span className="text-xs text-muted-foreground">Current</span>
                    )}
                  </div>
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        );
      })}

      {/* Render collaborator cursors with improved positioning */}
      {collaboratorCursors.map((cursor) => cursor && (
        <CollaboratorCursor
          key={`cursor-${cursor.id}`}
          username={cursor.username}
          color={cursor.color}
          position={cursor.position}
        />
      ))}

      {/* Performance indicator in development */}
      {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          Elements: {scriptElements.length} | Online: {collaborators.filter(c => c.status === 'online').length}
        </div>
      )}
    </>
  );
};
