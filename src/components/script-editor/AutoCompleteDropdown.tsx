
import React from 'react';
import { User, MapPin, ArrowRight } from 'lucide-react';
import { AutoCompleteType } from '@/hooks/useScriptAutoComplete';

interface AutoCompleteSuggestion {
  text: string;
  type: AutoCompleteType;
  description?: string;
}

interface AutoCompleteDropdownProps {
  suggestions: AutoCompleteSuggestion[];
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (suggestion: AutoCompleteSuggestion) => void;
  position: { top: number; left: number };
}

export const AutoCompleteDropdown = ({
  suggestions,
  isVisible,
  selectedIndex,
  onSelect,
  position
}: AutoCompleteDropdownProps) => {
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: AutoCompleteType) => {
    switch (type) {
      case 'character': return <User className="h-3.5 w-3.5" />;
      case 'location':  return <MapPin className="h-3.5 w-3.5" />;
      case 'transition': return <ArrowRight className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <div
      className="absolute z-[100] animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ top: position.top, left: position.left }}
    >
      {/* Arrow pointing up to the input */}
      <div className="ml-6 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#2a2a3a]" />

      <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#1c1c2e] min-w-[260px] max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Characters in script
          </span>
          <span className="text-[9px] text-gray-600">↑↓ navigate · ↵ select</span>
        </div>

        {/* Suggestion rows */}
        <div className="py-1">
          {suggestions.map((suggestion, index) => {
            const isSelected = index === selectedIndex;
            // Highlight matching prefix
            const typed = suggestion.text.substring(0, suggestion.text.length);

            return (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                type="button"
                onClick={() => onSelect(suggestion)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-75
                  ${isSelected
                    ? 'bg-gradient-to-r from-naija-green/25 to-emerald-600/10 border-l-2 border-naija-green text-white'
                    : 'border-l-2 border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {/* Icon bubble */}
                <span
                  className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0
                    ${isSelected ? 'bg-naija-green/30 text-naija-green' : 'bg-gray-700/60 text-gray-400'}
                  `}
                >
                  {getIcon(suggestion.type)}
                </span>

                {/* Name */}
                <span className="font-mono font-semibold text-sm tracking-wider flex-1 truncate">
                  {suggestion.text}
                </span>

                {/* Tag */}
                {suggestion.description && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-naija-green/20 text-naija-green'
                      : 'bg-gray-700 text-gray-500'
                  }`}>
                    {suggestion.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
