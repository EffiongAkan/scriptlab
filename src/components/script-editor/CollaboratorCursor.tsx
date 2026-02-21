
import React from 'react';

interface CollaboratorCursorProps {
  username: string;
  color: string;
  position: { top: number; left: number };
}

const CollaboratorCursor = ({ username, color, position }: CollaboratorCursorProps) => {
  return (
    <div 
      className="absolute pointer-events-none"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        zIndex: 50
      }}
    >
      <div 
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: color }}
      />
      <div 
        className="absolute px-2 py-1 rounded text-xs text-white whitespace-nowrap"
        style={{ 
          backgroundColor: color,
          top: '-20px',
          left: '0px'
        }}
      >
        {username}
      </div>
    </div>
  );
};

export default CollaboratorCursor;
