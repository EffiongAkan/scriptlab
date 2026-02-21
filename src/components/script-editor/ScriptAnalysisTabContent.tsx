import React from 'react';
import { EnhancedScriptAnalysisPanel } from './analysis/EnhancedScriptAnalysisPanel';
import { Genre, Language } from '@/types';

interface ScriptAnalysisTabContentProps {
  elements: any[];
  genre?: Genre;
  language?: Language;
  onApplySuggestion?: (elementId: string, newContent: string) => void;
  synopsis?: string;
  industry?: string;
}

export const ScriptAnalysisTabContent: React.FC<ScriptAnalysisTabContentProps> = ({
  elements,
  genre,
  language,
  onApplySuggestion,
  synopsis,
  industry
}) => {
  return <EnhancedScriptAnalysisPanel
    elements={elements}
    genre={genre}
    language={language}
    onApplySuggestion={onApplySuggestion}
    synopsis={synopsis}
    industry={industry}
  />;
};
