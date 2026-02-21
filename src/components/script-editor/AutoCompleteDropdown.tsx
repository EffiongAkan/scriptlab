
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Clock, Zap, ArrowRight } from 'lucide-react';
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
      case 'character':
        return <User className="h-3 w-3" />;
      case 'location':
        return <MapPin className="h-3 w-3" />;
      case 'time':
        return <Clock className="h-3 w-3" />;
      case 'action':
        return <Zap className="h-3 w-3" />;
      case 'transition':
        return <ArrowRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: AutoCompleteType) => {
    switch (type) {
      case 'character':
        return 'bg-blue-100 text-blue-800';
      case 'location':
        return 'bg-green-100 text-green-800';
      case 'time':
        return 'bg-purple-100 text-purple-800';
      case 'action':
        return 'bg-orange-100 text-orange-800';
      case 'transition':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className="absolute z-50 w-80 max-h-64 overflow-y-auto border shadow-lg bg-background"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2">
        <div className="text-xs text-muted-foreground mb-2 px-2">
          Suggestions (Use ↑↓ to navigate, Enter to select)
        </div>
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.type}-${suggestion.text}-${index}`}
            className={`
              flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
              ${index === selectedIndex 
                ? 'bg-primary/10 border border-primary/20' 
                : 'hover:bg-muted/50'
              }
            `}
            onClick={() => onSelect(suggestion)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge 
                variant="secondary" 
                className={`${getTypeColor(suggestion.type)} text-xs px-1.5 py-0.5 flex items-center gap-1`}
              >
                {getIcon(suggestion.type)}
                {suggestion.type}
              </Badge>
              <span className="font-mono text-sm truncate">
                {suggestion.text}
              </span>
            </div>
            {suggestion.description && (
              <span className="text-xs text-muted-foreground">
                {suggestion.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
