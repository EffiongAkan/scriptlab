
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Zap, Volume2, Heart, RefreshCw } from 'lucide-react';
import { generateDeepseekContent } from '@/services/deepseek-ai-service';

interface DialogueSuggestion {
  id: string;
  original: string;
  enhanced: string;
  improvement: string;
  emotionalTone: string;
  culturalNote?: string;
}

interface DialogueEnhancerProps {
  scriptId: string;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
}

export const DialogueEnhancer: React.FC<DialogueEnhancerProps> = ({
  scriptId,
  elements,
  onApplySuggestion,
  isGenerating,
  onGenerate
}) => {
  const [selectedDialogue, setSelectedDialogue] = useState('');
  const [enhancementType, setEnhancementType] = useState<'emotion' | 'culture' | 'clarity'>('emotion');
  const [suggestions, setSuggestions] = useState<DialogueSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleEnhanceDialogue = async () => {
    if (!selectedDialogue.trim()) return;
    setLoading(true);
    const { content, success } = await generateDeepseekContent({
      prompt: `Enhance this dialogue for ${enhancementType}: "${selectedDialogue}" as a Nigerian scriptwriter. Give original, enhanced, improvement reason, and emotional tone, plus cultural note if relevant.`,
      feature: 'dialogue',
      maxTokens: 250,
      temperature: 0.7
    });
    setLoading(false);

    if (success && content) {
      // Try to parse Deepseek AI output into fields.
      const lines = content.split('\n').map(s => s.trim());
      // Find markers if any
      const getVal = (key: string) => lines.find(l => l.toLowerCase().startsWith(key)) || '';
      const suggestion: DialogueSuggestion = {
        id: Date.now().toString(),
        original: getVal('original:') ? getVal('original:').split(':').slice(1).join(':').trim() : selectedDialogue,
        enhanced: getVal('enhanced:') ? getVal('enhanced:').split(':').slice(1).join(':').trim() : content,
        improvement: getVal('improvement:') ? getVal('improvement:').split(':').slice(1).join(':').trim() : '',
        emotionalTone: getVal('emotional tone:') ? getVal('emotional tone:').split(':').slice(1).join(':').trim() : enhancementType,
        culturalNote: getVal('cultural note:') ? getVal('cultural note:').split(':').slice(1).join(':').trim() : '',
      };
      setSuggestions(prev => [suggestion, ...prev]);
    }
  };

  const getEmotionIcon = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'urgent': return <Zap className="h-3 w-3" />;
      case 'skeptical': return <MessageCircle className="h-3 w-3" />;
      default: return <Heart className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Dialogue Enhancer
          {loading && <RefreshCw className="h-5 w-5 text-primary animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Dialogue Input */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Enhance Dialogue</h4>
            <div className="space-y-3">
              <Textarea
                placeholder="Paste dialogue to enhance..."
                value={selectedDialogue}
                onChange={(e) => setSelectedDialogue(e.target.value)}
                rows={3}
              />
              
              <div className="flex gap-2">
                <Button
                  variant={enhancementType === 'emotion' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnhancementType('emotion')}
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Emotion
                </Button>
                <Button
                  variant={enhancementType === 'culture' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnhancementType('culture')}
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Culture
                </Button>
                <Button
                  variant={enhancementType === 'clarity' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnhancementType('clarity')}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Clarity
                </Button>
              </div>
              
              <Button
                onClick={handleEnhanceDialogue}
                disabled={loading || !selectedDialogue.trim()}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Enhancing...' : 'Enhance Dialogue'}
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <h4 className="font-medium mb-3">Enhancement Suggestions</h4>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getEmotionIcon(suggestion.emotionalTone)}
                        {suggestion.emotionalTone}
                      </Badge>
                      {suggestion.culturalNote && (
                        <Badge variant="secondary" className="text-xs">
                          Cultural
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-xs text-red-600 font-medium mb-1">Original:</div>
                        <div className="text-sm">{suggestion.original}</div>
                      </div>
                      
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        <div className="text-xs text-green-600 font-medium mb-1">Enhanced:</div>
                        <div className="text-sm font-medium">{suggestion.enhanced}</div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <strong>Improvement:</strong> {suggestion.improvement}
                      </div>
                      
                      {suggestion.culturalNote && (
                        <div className="text-xs text-blue-600">
                          <strong>Cultural Note:</strong> {suggestion.culturalNote}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => onApplySuggestion('current', suggestion.enhanced)}
                      >
                        Apply Enhancement
                      </Button>
                      <Button variant="outline" size="sm">
                        Save for Later
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

