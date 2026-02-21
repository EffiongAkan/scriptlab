
import React, { useEffect, useState } from 'react';
import { useCollaboratorPresence } from '@/hooks/useCollaboratorPresence';
import { useCollaborativeCursor } from '@/hooks/useCollaborativeCursor';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LiveCursorSystemProps {
  scriptId: string;
  currentUserId?: string;
}

interface CursorPosition {
  x: number;
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
  scriptId,
  currentUserId
}) => {
  const [collaboratorCursors, setCollaboratorCursors] = useState<CollaboratorCursor[]>([]);
  const { collaborators } = useCollaboratorPresence(scriptId, []);
  const { updateSelectionPosition } = useCollaborativeCursor();

  // Predefined colors for cursors
  const cursorColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  useEffect(() => {
    // Map online collaborators to cursor format
    const activeCursors = collaborators
      .filter(collab => collab.id !== currentUserId && collab.status === 'online' && collab.cursor)
      .map((collab, index) => ({
        userId: collab.id,
        username: collab.username || 'Anonymous',
        avatar: collab.avatar_url,
        position: {
          x: collab.cursor?.position || 0,
          y: 0, // We only track linear position (index) for now, or we need to map elementId to Y coordinate
          elementId: collab.cursor?.elementId,
          timestamp: Date.now()
        },
        color: cursorColors[index % cursorColors.length]
      }));

    setCollaboratorCursors(activeCursors);
  }, [collaborators, currentUserId]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {collaboratorCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: cursor.position.x,
            top: cursor.position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Cursor pointer */}
          <div
            className="w-4 h-4 rotate-45 transform"
            style={{ backgroundColor: cursor.color }}
          />

          {/* User info badge */}
          <div className="absolute top-4 left-0 pointer-events-auto">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              style={{ backgroundColor: cursor.color, color: 'white' }}
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={cursor.avatar} />
                <AvatarFallback className="text-xs">
                  {cursor.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {cursor.username}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
