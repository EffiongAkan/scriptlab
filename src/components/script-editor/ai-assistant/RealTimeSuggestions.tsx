import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { generateDeepseekContent } from '@/services/deepseek-ai-service';
import { SuggestionPreferences } from "./SuggestionPreferences";
import { useRealTimeSuggestions } from "./useRealTimeSuggestions";
import { SuggestionCard } from "./SuggestionCard";

interface Suggestion {
  id: string;
  type: 'improvement' | 'addition' | 'alternative';
  content: string;
  reason: string;
  confidence: number;
  elementId: string;
}

interface RealTimeSuggestionsProps {
  scriptId: string;
  currentElement?: any;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
}

export const RealTimeSuggestions: React.FC<RealTimeSuggestionsProps> = ({
  scriptId,
  currentElement,
  elements,
  onApplySuggestion,
  isGenerating,
  onGenerate
}) => {
  const [preferences, setPreferences] = React.useState<string[]>(["improvement", "addition", "alternative"]);

  const {
    suggestions,
    loading,
    appliedSuggestions,
    handleApplySuggestion,
    handleDismissSuggestion,
  } = useRealTimeSuggestions({
    scriptId,
    currentElement,
    elements,
    preferences,
    isGenerating,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Real-time Suggestions
          </div>
          <div className="flex gap-2 items-center">
            <SuggestionPreferences preferences={preferences} onChange={setPreferences} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerate('Generate new suggestions')}
              disabled={isGenerating || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating || loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {loading || isGenerating ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 animate-pulse opacity-50" />
                <p>Generating real AI suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to get AI suggestions...</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  applied={appliedSuggestions.has(suggestion.id)}
                  onApply={() => handleApplySuggestion(suggestion, onApplySuggestion)}
                  onDismiss={() => handleDismissSuggestion(suggestion.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
