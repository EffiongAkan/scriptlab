import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, X, Check, Zap } from 'lucide-react';
import { generateDeepseekContent } from '@/services/deepseek-ai-service';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  id: string;
  type: 'improvement' | 'addition' | 'alternative';
  content: string;
  reason: string;
  confidence: number;
}

interface ContextualSuggestionsMenuProps {
  position: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  currentText: string;
  context: string;
  onApplySuggestion: (content: string) => void;
  scriptId: string;
}

export const ContextualSuggestionsMenu: React.FC<ContextualSuggestionsMenuProps> = ({
  position,
  isVisible,
  onClose,
  currentText,
  context,
  onApplySuggestion,
  scriptId
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close menu when clicking outside (but not when clicking on contentEditable)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking on a contentEditable element or its children
      if (target.closest('[contenteditable="true"]')) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Generate suggestions when menu becomes visible
  useEffect(() => {
    if (isVisible && currentText) {
      generateSuggestions();
    }
  }, [isVisible, currentText, context]);

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const prompt = `
        Analyze this script content and provide 3 contextual suggestions:
        
        Current text: "${currentText}"
        Context: "${context}"
        
        Provide suggestions in JSON format with this structure:
        {
          "suggestions": [
            {
              "id": "unique_id",
              "type": "improvement|addition|alternative",
              "content": "suggested text",
              "reason": "explanation",
              "confidence": 85
            }
          ]
        }
      `;

      const request = {
        prompt,
        context,
        feature: 'suggestion' as const,
        maxTokens: 500,
        temperature: 0.7
      };

      const response = await generateDeepseekContent(request);

      try {
        const parsed = JSON.parse(response.content);
        if (parsed.suggestions) {
          setSuggestions(parsed.suggestions.slice(0, 3));
        }
      } catch (parseError) {
        // Fallback to creating suggestions from response text
        const fallbackSuggestions: Suggestion[] = [
          {
            id: 'suggestion-1',
            type: 'improvement',
            content: response.content.slice(0, 100) + '...',
            reason: 'AI-generated improvement',
            confidence: 75
          }
        ];
        setSuggestions(fallbackSuggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    onApplySuggestion(suggestion.content);
    onClose();
    toast({
      title: "Suggestion Applied",
      description: `Applied ${suggestion.type} suggestion`,
    });
  };

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'improvement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'addition':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'alternative':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 max-h-96"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, 10px)',
        pointerEvents: 'none'
      }}
    >
      <Card className="border shadow-lg animate-fade-in" style={{ pointerEvents: 'auto' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Suggestions</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Lightbulb className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs">Generating suggestions...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-xs">No suggestions available</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getTypeColor(suggestion.type)}`}>
                        {suggestion.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm">{suggestion.content}</p>
                    <p className="text-xs text-muted-foreground italic">
                      {suggestion.reason}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Apply Suggestion
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={generateSuggestions}
                disabled={loading}
                className="w-full text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Generate New Suggestions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};