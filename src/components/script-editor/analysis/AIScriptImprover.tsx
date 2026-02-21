
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, RefreshCw, CheckCircle } from 'lucide-react';
import { generatePlotContent, PlotAIRequest } from '@/services/plot-ai-service';
import { useToast } from '@/hooks/use-toast';
import { Genre, Language } from '@/types';

interface AIScriptImproverProps {
  currentElement?: any;
  elements: any[];
  onApplyImprovement: (elementId: string, newContent: string) => void;
  genre?: Genre;
  language?: Language;
}

type ImprovementType = 'dialogue' | 'action' | 'character' | 'pacing' | 'cultural' | 'structure';

export const AIScriptImprover: React.FC<AIScriptImproverProps> = ({
  currentElement,
  elements,
  onApplyImprovement,
  genre,
  language
}) => {
  const [improvementType, setImprovementType] = useState<ImprovementType>('dialogue');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImprovement, setGeneratedImprovement] = useState('');
  const [showImprovement, setShowImprovement] = useState(false);
  const { toast } = useToast();

  const improvementPrompts = {
    dialogue: 'Improve this dialogue to be more natural, authentic, and character-specific. Ensure it sounds genuinely Nigerian and advances the plot',
    action: 'Enhance this action description to be more visual, specific, and cinematically engaging while maintaining screenplay format',
    character: 'Develop this character moment to reveal more personality, background, or motivation through their actions and words',
    pacing: 'Adjust this scene element to improve the overall pacing - either quicken the tempo or allow more breathing room as needed',
    cultural: 'Enhance the cultural authenticity of this element, incorporating more genuine Nigerian details, references, or language patterns',
    structure: 'Improve the structural flow and connection of this element within the larger scene and script context'
  };

  const generateImprovement = async () => {
    if (!currentElement) {
      toast({
        title: "No Element Selected",
        description: "Please select a script element to improve.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setShowImprovement(false);

    try {
      const context = elements
        .slice(Math.max(0, elements.indexOf(currentElement) - 2), elements.indexOf(currentElement) + 3)
        .map(el => `${el.type.toUpperCase()}: ${el.content}`)
        .join('\n');

      const basePrompt = customPrompt || improvementPrompts[improvementType];
      
      const fullPrompt = `${basePrompt}

Current element to improve:
TYPE: ${currentElement.type.toUpperCase()}
CONTENT: ${currentElement.content}

Context (surrounding elements):
${context}

Please provide an improved version that maintains the original intent but enhances quality, authenticity, and impact. Return ONLY the improved content without explanations.`;

      const request: PlotAIRequest = {
        promptType: 'dialogue',
        genre: genre,
        language: language || Language.ENGLISH,
        seedPlot: fullPrompt,
        culturalAuthenticity: 90,
        includeTraditional: true
      };

      const response = await generatePlotContent(request);
      
      if (response.success && response.content) {
        setGeneratedImprovement(response.content.trim());
        setShowImprovement(true);
        toast({
          title: "Improvement Generated",
          description: "AI has suggested an enhancement for your script element.",
        });
      } else {
        throw new Error(response.error || "Failed to generate improvement");
      }
    } catch (error) {
      console.error("Improvement generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate improvement",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyImprovement = () => {
    if (currentElement && generatedImprovement) {
      onApplyImprovement(currentElement.id, generatedImprovement);
      setShowImprovement(false);
      setGeneratedImprovement('');
      toast({
        title: "Improvement Applied",
        description: "The enhanced content has been applied to your script.",
      });
    }
  };

  const regenerateImprovement = () => {
    setGeneratedImprovement('');
    generateImprovement();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Script Improver
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentElement && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{currentElement.type}</Badge>
              <span className="text-sm font-medium">Selected Element</span>
            </div>
            <p className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
              {currentElement.content}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Improvement Focus</label>
            <Select value={improvementType} onValueChange={(value) => setImprovementType(value as ImprovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dialogue">Dialogue Enhancement</SelectItem>
                <SelectItem value="action">Action Description</SelectItem>
                <SelectItem value="character">Character Development</SelectItem>
                <SelectItem value="pacing">Pacing Adjustment</SelectItem>
                <SelectItem value="cultural">Cultural Authenticity</SelectItem>
                <SelectItem value="structure">Structural Flow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Custom Instructions (Optional)</label>
            <Textarea 
              placeholder="Add specific instructions for how you'd like this element improved..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={generateImprovement}
            disabled={!currentElement || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Improvement...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Improvement
              </>
            )}
          </Button>
        </div>

        {showImprovement && generatedImprovement && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">AI Improvement Suggestion</h4>
              <Button variant="ghost" size="sm" onClick={regenerateImprovement}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{generatedImprovement}</p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={applyImprovement} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Improvement
              </Button>
              <Button variant="outline" onClick={() => setShowImprovement(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {!currentElement && (
          <div className="text-center py-4 text-muted-foreground">
            <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a script element to generate AI improvements</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
