
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Brain, TrendingUp, Users, Clock, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { EnhancedScriptAnalyzer, ScriptAnalysisResult, DetailedSuggestion } from '@/services/enhanced-script-analysis';
import { useToast } from '@/hooks/use-toast';
import { Genre, Language } from '@/types';

interface ScriptAnalysisPanelProps {
  elements: any[];
  genre?: Genre;
  language?: Language;
  onApplySuggestion?: (suggestion: DetailedSuggestion) => void;
}

export const ScriptAnalysisPanel: React.FC<ScriptAnalysisPanelProps> = ({
  elements,
  genre,
  language,
  onApplySuggestion
}) => {
  const [analysis, setAnalysis] = useState<ScriptAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DetailedSuggestion | null>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    if (!elements || elements.length === 0) {
      toast({
        title: "No Content",
        description: "Add some script content to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await EnhancedScriptAnalyzer.analyzeScript(elements, genre, language);
      setAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: `Generated ${result.suggestions.length} suggestions for improvement.`,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (elements && elements.length > 0) {
      runAnalysis();
    }
  }, [elements, genre, language]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (severity: DetailedSuggestion['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityBadgeColor = (severity: DetailedSuggestion['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Your Script</h3>
            <p className="text-muted-foreground">AI is reviewing your screenplay for improvements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced Script Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No analysis available. Add script content to get started.</p>
            <Button onClick={runAnalysis} disabled={!elements || elements.length === 0}>
              <Brain className="h-4 w-4 mr-2" />
              Analyze Script
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Script Quality Score
            </span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.metrics.overallScore)}`}>
              {analysis.metrics.overallScore}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Plot Structure</span>
                <span className={getScoreColor(analysis.metrics.plotStructure)}>
                  {analysis.metrics.plotStructure}%
                </span>
              </div>
              <Progress value={analysis.metrics.plotStructure} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Character Dev</span>
                <span className={getScoreColor(analysis.metrics.characterDevelopment)}>
                  {analysis.metrics.characterDevelopment}%
                </span>
              </div>
              <Progress value={analysis.metrics.characterDevelopment} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dialogue</span>
                <span className={getScoreColor(analysis.metrics.dialogueQuality)}>
                  {analysis.metrics.dialogueQuality}%
                </span>
              </div>
              <Progress value={analysis.metrics.dialogueQuality} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pacing</span>
                <span className={getScoreColor(analysis.metrics.pacing)}>
                  {analysis.metrics.pacing}%
                </span>
              </div>
              <Progress value={analysis.metrics.pacing} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cultural Auth</span>
                <span className={getScoreColor(analysis.metrics.culturalAuthenticity)}>
                  {analysis.metrics.culturalAuthenticity}%
                </span>
              </div>
              <Progress value={analysis.metrics.culturalAuthenticity} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Formatting</span>
                <span className={getScoreColor(analysis.metrics.technicalFormatting)}>
                  {analysis.metrics.technicalFormatting}%
                </span>
              </div>
              <Progress value={analysis.metrics.technicalFormatting} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions">
            Suggestions ({analysis.suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="characters">
            Characters ({analysis.characterAnalysis.length})
          </TabsTrigger>
          <TabsTrigger value="pacing">Pacing</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Improvement Suggestions</h3>
            <Button variant="outline" size="sm" onClick={runAnalysis}>
              <Brain className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion) => (
                <Card key={suggestion.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedSuggestion?.id === suggestion.id ? 'bg-muted' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(suggestion.severity)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityBadgeColor(suggestion.severity)}>
                            {suggestion.severity}
                          </Badge>
                          <Badge variant="outline">
                            {suggestion.type}
                          </Badge>
                          {suggestion.aiGenerated && (
                            <Badge variant="secondary">AI</Badge>
                          )}
                        </div>
                        <h4 className="font-medium">{suggestion.title}</h4>
                        {suggestion.description && (
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        )}
                        <p className="text-sm">{suggestion.suggestion}</p>
                         {onApplySuggestion && (
                           <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="outline"
                               onClick={() => onApplySuggestion(suggestion)}
                             >
                               Apply Fix
                             </Button>
                             <Button 
                               size="sm" 
                               variant="ghost"
                               onClick={() => setSelectedSuggestion(selectedSuggestion?.id === suggestion.id ? null : suggestion)}
                             >
                               {selectedSuggestion?.id === suggestion.id ? 'Hide Details' : 'View Details'}
                             </Button>
                           </div>
                         )}
                         {selectedSuggestion?.id === suggestion.id && (
                           <div className="mt-3 p-3 bg-slate-900/50 rounded text-xs">
                             <p className="text-gray-300 mb-2">
                               <strong>Detailed Solution:</strong> {suggestion.suggestion}
                             </p>
                             {suggestion.elementId && (
                               <p className="text-gray-400">
                                 <strong>Location:</strong> Element {suggestion.elementId}
                               </p>
                             )}
                           </div>
                         )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="characters" className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Character Analysis
          </h3>
          
          <div className="grid gap-4">
            {analysis.characterAnalysis.map((character, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{character.name}</h4>
                    <Badge variant="secondary">{character.appearances} appearances</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Development</span>
                      <div className="flex items-center gap-2">
                        <Progress value={character.developmentScore} className="h-2 flex-1" />
                        <span className="text-sm">{character.developmentScore}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Consistency</span>
                      <div className="flex items-center gap-2">
                        <Progress value={character.consistencyScore} className="h-2 flex-1" />
                        <span className="text-sm">{character.consistencyScore}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {character.suggestions.slice(0, 2).map((suggestion, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {suggestion}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pacing" className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pacing Analysis
          </h3>
          
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Overall Pacing</span>
                  <p className="text-lg font-medium capitalize">{analysis.paceAnalysis.overallPacing}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Avg Scene Length</span>
                  <p className="text-lg font-medium">{Math.round(analysis.paceAnalysis.averageSceneLength)} elements</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Dialogue/Action Ratio</span>
                  <p className="text-lg font-medium">{analysis.paceAnalysis.dialogueToActionRatio.toFixed(1)}:1</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Transition Quality</span>
                  <p className="text-lg font-medium">{Math.round(analysis.paceAnalysis.sceneTransitionQuality)}%</p>
                </div>
              </div>
              
              {analysis.paceAnalysis.suggestions.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Pacing Suggestions:</h5>
                  <div className="space-y-1">
                    {analysis.paceAnalysis.suggestions.map((suggestion, i) => (
                      <p key={i} className="text-sm text-muted-foreground">• {suggestion}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strengths" className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Script Strengths
          </h3>
          
          <div className="grid gap-3">
            {analysis.strengthsIdentified.map((strength, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <p className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {strength}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {analysis.culturalNotes.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Cultural Authenticity Notes:</h4>
              <div className="space-y-2">
                {analysis.culturalNotes.map((note, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <p className="text-sm">{note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
