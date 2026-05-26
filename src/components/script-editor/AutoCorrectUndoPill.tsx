import React, { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AutoCorrectUndoPillProps {
  original: string;
  corrected: string;
  onUndo: () => void;
  position?: { top: number; left: number };
}

export const AutoCorrectUndoPill: React.FC<AutoCorrectUndoPillProps> = ({
  original,
  corrected,
  onUndo,
  position
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000); // 4 seconds before hiding

    return () => clearTimeout(timer);
  }, [original, corrected]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "absolute z-50 flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-black/80 backdrop-blur-md border border-white/10 shadow-lg",
        "animate-in fade-in zoom-in duration-200"
      )}
      style={
        position 
          ? { top: position.top, left: position.left } 
          : { bottom: '100%', left: '0', marginBottom: '8px' }
      }
    >
      <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
        <span className="line-through opacity-70">{original}</span> → <span className="text-naija-green">{corrected}</span>
      </span>
      <div className="w-px h-3 bg-white/20 mx-1" />
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-auto p-0 text-xs text-blue-400 hover:text-blue-300 hover:bg-transparent flex items-center gap-1"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUndo();
            setIsVisible(false);
        }}
      >
        <Undo2 className="w-3 h-3" />
        Undo
      </Button>
    </div>
  );
};
