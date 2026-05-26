import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScriptAutocorrectBubbleProps {
  original: string;
  suggestion: string;
  onApply: () => void;
  onDismiss: () => void;
  position: { top: number; left: number };
}

export const ScriptAutocorrectBubble: React.FC<ScriptAutocorrectBubbleProps> = ({
  original,
  suggestion,
  onApply,
  onDismiss,
  position
}) => {
  return (
    <div 
      className={cn(
        "absolute z-[100] flex items-center bg-[#1a1a1a]/95 backdrop-blur-md text-white rounded-lg shadow-2xl border border-white/20",
        "animate-in fade-in zoom-in duration-200 origin-bottom scale-95 hover:scale-100 transition-transform"
      )}
      style={{ 
        top: position.top - 46, // Slightly higher
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="p-2 hover:bg-white/10 rounded-l-lg border-r border-white/10 group transition-colors"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
      </button>
      
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onApply();
        }}
        className="px-4 py-2 text-[13px] font-semibold hover:bg-white/10 rounded-r-lg transition-colors flex items-center gap-2"
      >
        <span className="text-gray-400 font-normal">Suggest:</span>
        <span className="text-naija-gold">{suggestion}</span>
      </button>

      {/* Triangle pointer with shadow */}
      <div 
        className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 
                   border-l-[8px] border-l-transparent 
                   border-r-[8px] border-r-transparent 
                   border-t-[8px] border-t-[#1a1a1a]/95"
      />
    </div>
  );
};
