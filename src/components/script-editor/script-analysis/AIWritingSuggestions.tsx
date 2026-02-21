
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, Lightbulb, RefreshCw, Copy, Check } from 'lucide-react';
import { AIWritingAssistant } from '@/services/ai-writing-assistant';
import { useToast } from '@/hooks/use-toast';

interface AIWritingSuggestionsProps {
  currentElement?: {
    id: string;
    type: string;
    content: string;
  };
  previousElements: any[];
  onSuggestionApply?: (elementId: string, newContent: string) => void;
}

export const AIWritingSuggestions: React.FC<AIWritingSuggestionsProps> = ({
  currentElement,
  previousElements = [],
  onSuggestionApply
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateSuggestions = useCallback(async () => {
    if (!currentElement) {
      toast({
        title: "No Element Selected",
        description: "Please select a script element to get AI suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const context = customPrompt || currentElement.content;
      const newSuggestions = await AIWritingAssistant.generateContentSuggestion(
        currentElement.type,
        context,
        previousElements
      );
      setSuggestions(newSuggestions);
      
      toast({
        title: "Suggestions Generated",
        description: `Generated ${newSuggestions.length} AI suggestions for your ${currentElement.type}.`
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentElement, customPrompt, previousElements, toast]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      
      toast({
        title: "Copied",
        description: "Suggestion copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy suggestion to clipboard.",
        variant: "destructive"
      });
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (currentElement && onSuggestionApply) {
      onSuggestionApply(currentElement.id, suggestion);
      toast({
        title: "Suggestion Applied",
        description: "AI suggestion has been applied to your script."
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Writing Assistant
        </CardTitle>
        <CardDescription>
          Get intelligent suggestions to improve your writing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Element Info */}
        {currentElement && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{currentElement.type}</Badge>
              <span className="text-sm font-medium">Current Element</span>
            </div>
            <p className="text-sm text-muted-foreground">
              "{currentElement.content.substring(0, 100)}..."
            </p>
          </div>
        )}

        {/* Custom Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Custom Request (Optional)
          </label>
          <Textarea
            placeholder="Describe what kind of suggestions you'd like..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateSuggestions}
          disabled={!currentElement || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate AI Suggestions'}
        </Button>

        <Separator />

        {/* Suggestions List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Suggestions</h4>
          
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No suggestions yet. Click "Generate AI Suggestions" to get started.
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm mb-3">{suggestion}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(suggestion, index)}
                        className="flex-1"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {copiedIndex === index ? 'Copied' : 'Copy'}
                      </Button>
                      
                      {onSuggestionApply && currentElement && (
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="flex-1"
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Tips */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-1">💡 Tips</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Select different script elements for tailored suggestions</li>
            <li>• Use custom requests for specific writing challenges</li>
            <li>• Copy suggestions to edit them before applying</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
