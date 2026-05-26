import React, { useEffect, useState, useCallback } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface LiveCursorSystemProps {
  scriptId: string;
}

interface CursorPosition {
  x: number; // Represents the absolute text offset
  y: number;
  elementId?: string;
  timestamp: number;
}

interface CollaboratorCursor {
  userId: string;
  username: string;
  avatar?: string;
  position: CursorPosition;
  color: string;
}

export const LiveCursorSystem: React.FC<LiveCursorSystemProps> = ({
  scriptId
}) => {
  const [collaboratorCursors, setCollaboratorCursors] = useState<CollaboratorCursor[]>([]);
  const [renderedCursors, setRenderedCursors] = useState<(CollaboratorCursor & { screenX: number, screenY: number })[]>([]);
  const { collaborators, localSessionId } = useCollaboration();

  // Helper to get exact screen coordinates from absolute character offset
  const getCaretCoordinates = useCallback((elementId: string, position: number): { x: number, y: number } | null => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    let charCount = 0;
    let targetNode: Node | null = null;
    let targetOffset = 0;

    const traverseNodes = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (charCount + textLength >= position) {
          targetNode = node;
          targetOffset = Math.max(0, position - charCount);
          return true;
        }
        charCount += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverseNodes(node.childNodes[i])) return true;
        }
        if (node.nodeName === 'BR' && charCount === position) {
            targetNode = node.parentNode;
            targetOffset = Array.from(node.parentNode!.childNodes).indexOf(node as ChildNode);
            return true;
        }
      }
      return false;
    };

    traverseNodes(element);

    if (targetNode) {
      try {
        const range = document.createRange();
        range.setStart(targetNode, targetOffset);
        let rect = range.getBoundingClientRect();
        
        // If range bounding client rect fails (e.g. at line start, or collapsed at the end), 
        // we insert a temporary invisible character to get exact bounds
        if (rect.width === 0 && rect.height === 0 && rect.top === 0) {
            const span = document.createElement('span');
            span.appendChild(document.createTextNode('\u200b')); // Zero-width space
            range.insertNode(span);
            rect = span.getBoundingClientRect();
            span.parentNode?.removeChild(span);
            // DO NOT modify the window selection here, it ruins the local user's typing experience!
        }
        
        // If it's still 0, fallback to the element's top-left with some padding
        if (rect.width === 0 && rect.height === 0 && rect.top === 0) {
            const elRect = element.getBoundingClientRect();
            return { x: elRect.left, y: elRect.top };
        }
        
        return { x: rect.left, y: rect.top };
      } catch (e) {
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }
    }
    
    // If text node not found (e.g., empty element), get the absolute start of where text WOULD be
    // by inserting a temporary text node
    try {
      const span = document.createElement('span');
      span.appendChild(document.createTextNode('\u200b'));
      element.appendChild(span);
      const rect = span.getBoundingClientRect();
      element.removeChild(span);
      return { x: rect.left, y: rect.top };
    } catch(e) {
      const rect = element.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    }
  }, []);

  useEffect(() => {
    const activeCursors = collaborators
      .filter(collab => collab.session_id !== localSessionId && collab.status === 'online' && collab.cursor)
      .map((collab, index) => {
        return {
          userId: collab.presence_ref || collab.id,
          username: collab.username || 'Anonymous',
          avatar: collab.avatar_url,
          position: {
            x: collab.cursor?.position || 0,
            y: 0,
            elementId: collab.cursor?.elementId,
            timestamp: Date.now()
          },
          color: collab.color || '#FF6B6B' // Fallback if no color is provided
        };
      });

    console.log('[LiveCursorSystem] activeCursors:', activeCursors);
    setCollaboratorCursors(activeCursors);
  }, [collaborators, localSessionId]);

  const updateCursorPositions = useCallback(() => {
    const updated = collaboratorCursors.map(cursor => {
      if (cursor.position.elementId) {
        const coords = getCaretCoordinates(cursor.position.elementId, cursor.position.x);
        if (coords) {
          return { ...cursor, screenX: coords.x, screenY: coords.y };
        }
      }
      return null;
    }).filter(Boolean) as (CollaboratorCursor & { screenX: number, screenY: number })[];
    
    setRenderedCursors(updated);
  }, [collaboratorCursors, getCaretCoordinates]);

  // Update when collaborators change
  useEffect(() => {
    updateCursorPositions();
  }, [updateCursorPositions]);

  // Continuous update loop to ensure cursors never detach when text shifts due to typing or layout changes
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = 0;

    const loop = (timestamp: number) => {
      // Update at roughly 60fps (every ~16ms)
      if (timestamp - lastUpdate >= 16) {
        updateCursorPositions();
        lastUpdate = timestamp;
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    // Also keep event listeners for immediate response to scroll/resize
    window.addEventListener('scroll', updateCursorPositions, true);
    window.addEventListener('resize', updateCursorPositions);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', updateCursorPositions, true);
      window.removeEventListener('resize', updateCursorPositions);
    };
  }, [updateCursorPositions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {renderedCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-75 ease-out pointer-events-none"
          style={{
            left: cursor.screenX,
            top: cursor.screenY,
          }}
        >
          {/* Vertical cursor line */}
          <div
            className="w-[2px] h-[1.2em] animate-pulse"
            style={{ backgroundColor: cursor.color }}
          />

          {/* User info badge attached to the top of the cursor */}
          <div 
            className="absolute -top-6 left-0 pointer-events-auto shadow-sm whitespace-nowrap"
            style={{ zIndex: 101 }}
          >
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 text-[10px] py-0.5 px-2 rounded-tl-sm rounded-tr-md rounded-br-md rounded-bl-sm border-none shadow-md"
              style={{ backgroundColor: cursor.color, color: 'white' }}
            >
              <Avatar className="w-3.5 h-3.5 -ml-1 border border-white/20">
                <AvatarImage src={cursor.avatar} />
                <AvatarFallback className="text-[8px] bg-white/20 text-white">
                  {cursor.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium tracking-tight truncate max-w-[100px]">{cursor.username}</span>
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
