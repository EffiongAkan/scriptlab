
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Zap, Settings, Brain, RefreshCw } from 'lucide-react';
import { generateDeepseekContent } from '@/services/deepseek-ai-service';

interface AutoCompleteOption {
  id: string;
  text: string;
  type: 'action' | 'dialogue' | 'character' | 'transition';
  confidence: number;
  context: string;
}

interface SmartAutoCompleteProps {
  scriptId: string;
  currentElement?: any;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
}

export const SmartAutoComplete: React.FC<SmartAutoCompleteProps> = ({
  scriptId,
  currentElement,
  elements,
  onApplySuggestion
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<AutoCompleteOption[]>([]);
  const [showContextual, setShowContextual] = useState(true);
  const [showCultural, setShowCultural] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAutoCompleteSuggestions = async () => {
      if (currentElement && isEnabled) {
        setLoading(true);
        const contextWindow = elements.map(el => el.content).slice(-8).join('\n');
        const { content, success } = await generateDeepseekContent({
          prompt:
            `Suggest up to 3 highly relevant and authentic script auto-completion options for this type: "${currentElement.type}" in a Nigerian screenplay. Use context below. Reply with option text only (each as a line), highest confidence first.\n\nContext:\n${contextWindow}`,
          feature: currentElement.type === 'dialogue' ? 'dialogue' : 'suggestion',
          maxTokens: 140,
          temperature: 0.6
        });
        setLoading(false);

        if (success && content) {
          const options: AutoCompleteOption[] =
            content
              .split('\n')
              .map((text: string, idx: number) => ({
                id: (Date.now() + idx).toString(),
                text: text.trim(),
                type: currentElement.type || 'action',
                confidence: 90 - (idx * 10),
                context: 'AI contextual'
              }))
              .filter(opt => opt.text);
          setAutoCompleteOptions(options);
        }
      } else {
        setAutoCompleteOptions([]);
      }
    };
    fetchAutoCompleteSuggestions();
  }, [currentElement, isEnabled, elements, showContextual, showCultural]);

  const getTypeColor = (type: AutoCompleteOption['type']) => {
    switch (type) {
      case 'action': return 'bg-blue-100 text-blue-800';
      case 'dialogue': return 'bg-green-100 text-green-800';
      case 'character': return 'bg-purple-100 text-purple-800';
      case 'transition': return 'bg-orange-100 text-orange-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Auto-Complete
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Settings */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Auto-Complete Settings
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Contextual Suggestions</div>
                  <div className="text-xs text-muted-foreground">Based on story context and character development</div>
                </div>
                <Switch
                  checked={showContextual}
                  onCheckedChange={setShowContextual}
                  disabled={!isEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Cultural Authenticity</div>
                  <div className="text-xs text-muted-foreground">Suggestions include Nigerian cultural elements</div>
                </div>
                <Switch
                  checked={showCultural}
                  onCheckedChange={setShowCultural}
                  disabled={!isEnabled}
                />
              </div>
            </div>
          </div>

          {/* Current Suggestions */}
          {isEnabled && (loading || autoCompleteOptions.length > 0) ? (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Current Suggestions
                {loading && <RefreshCw className="h-4 w-4 animate-spin ml-2" />}
              </h4>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse opacity-50" />
                    <p>Getting suggestions from AI...</p>
                  </div>
                ) :
                  autoCompleteOptions.map((option) => (
                  <div key={option.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getTypeColor(option.type)}`}>
                          {option.type.toUpperCase()}
                        </Badge>
                        <span className={`text-sm font-medium ${getConfidenceColor(option.confidence)}`}>
                          {option.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm mb-2 font-mono bg-gray-50 p-2 rounded border">
                      {option.text}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-3">
                      Context: {option.context}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onApplySuggestion('current', option.text)}
                      >
                        Insert
                      </Button>
                      <Button variant="outline" size="sm">
                        Modify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {isEnabled 
                  ? "Start typing to see smart auto-complete suggestions..."
                  : "Auto-complete is disabled. Enable it to see suggestions."
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

