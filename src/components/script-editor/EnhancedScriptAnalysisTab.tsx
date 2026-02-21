
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Wand2, TrendingUp } from 'lucide-react';
import { ScriptAnalysisPanel } from './analysis/ScriptAnalysisPanel';
import { AIScriptImprover } from './analysis/AIScriptImprover';
import { useScriptEditor } from '@/contexts/ScriptEditorContext';
import { Genre, Language } from '@/types';

interface EnhancedScriptAnalysisTabProps {
  elements: any[];
  onApplySuggestion?: (elementId: string, newContent: string) => void;
  genre?: Genre;
  language?: Language;
}

export const EnhancedScriptAnalysisTab: React.FC<EnhancedScriptAnalysisTabProps> = ({
  elements,
  onApplySuggestion,
  genre,
  language
}) => {
  const { focusedElementId } = useScriptEditor();
  const [activeTab, setActiveTab] = useState('analysis');

  // Find the currently focused element
  const currentElement = elements.find(el => el.id === focusedElementId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced Script Analysis & AI Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Script Analysis
              </TabsTrigger>
              <TabsTrigger value="improver" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                AI Improver
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-6">
              <ScriptAnalysisPanel
                elements={elements}
                genre={genre}
                language={language}
                onApplySuggestion={(suggestion) => {
                  if (onApplySuggestion && suggestion.elementId) {
                    onApplySuggestion(suggestion.elementId, suggestion.suggestion);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="improver" className="mt-6">
              <AIScriptImprover
                currentElement={currentElement}
                elements={elements}
                onApplyImprovement={onApplySuggestion || (() => {})}
                genre={genre}
                language={language}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
