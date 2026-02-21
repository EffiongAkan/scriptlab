
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Info, Lightbulb, Users, BookOpen, Target, TrendingUp } from 'lucide-react';
import { AIWritingAssistant, ScriptQualityMetrics, WritingSuggestion, CharacterArc, PlotStructure } from '@/services/ai-writing-assistant';
import { useToast } from '@/hooks/use-toast';

interface AdvancedScriptAnalyticsProps {
  elements: any[];
  isLoading?: boolean;
}

export const AdvancedScriptAnalytics: React.FC<AdvancedScriptAnalyticsProps> = ({
  elements,
  isLoading = false
}) => {
  const [analytics, setAnalytics] = useState<ScriptQualityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<WritingSuggestion | null>(null);
  const { toast } = useToast();

  // Memoize analytics to prevent unnecessary recalculations
  const memoizedAnalytics = useMemo(() => {
    if (!elements || elements.length === 0) return null;
    return AIWritingAssistant.analyzeScript(elements);
  }, [elements]);

  useEffect(() => {
    if (elements && elements.length > 0) {
      setIsAnalyzing(true);
      
      // Simulate analysis delay for better UX
      const timer = setTimeout(async () => {
        try {
          const result = await memoizedAnalytics;
          setAnalytics(result);
        } catch (error) {
          console.error('Error analyzing script:', error);
          toast({
            title: "Analysis Error",
            description: "Failed to analyze script. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsAnalyzing(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [elements, memoizedAnalytics, toast]);

  const getSeverityIcon = (severity: WritingSuggestion['severity']) => {
    switch (severity) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-green-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: WritingSuggestion['severity']) => {
    switch (severity) {
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'suggestion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading || isAnalyzing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Analyzing script...</span>
      </div>
    );
  }

  if (!analytics || !elements || elements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Script Analytics
          </CardTitle>
          <CardDescription>
            No script content available for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Start writing your script to see detailed analytics and suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Script Quality Score
            </span>
            <span className={`text-2xl font-bold ${getScoreColor(analytics.overallScore)}`}>
              {analytics.overallScore}/100
            </span>
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your screenplay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Character Development</span>
                <span className={getScoreColor(analytics.characterDevelopment)}>
                  {analytics.characterDevelopment}%
                </span>
              </div>
              <Progress value={analytics.characterDevelopment} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Plot Structure</span>
                <span className={getScoreColor(analytics.plotStructure)}>
                  {analytics.plotStructure}%
                </span>
              </div>
              <Progress value={analytics.plotStructure} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dialogue Quality</span>
                <span className={getScoreColor(analytics.dialogue)}>
                  {analytics.dialogue}%
                </span>
              </div>
              <Progress value={analytics.dialogue} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pacing</span>
                <span className={getScoreColor(analytics.pacing)}>
                  {analytics.pacing}%
                </span>
              </div>
              <Progress value={analytics.pacing} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Formatting</span>
                <span className={getScoreColor(analytics.formatting)}>
                  {analytics.formatting}%
                </span>
              </div>
              <Progress value={analytics.formatting} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions">
            Suggestions ({analytics.suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Writing Suggestions
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to improve your script
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {analytics.suggestions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Great job! No suggestions at this time.
                    </p>
                  ) : (
                    analytics.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedSuggestion?.id === suggestion.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedSuggestion(suggestion)}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(suggestion.severity)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getSeverityColor(suggestion.severity)}>
                                {suggestion.type}
                              </Badge>
                              <Badge variant="secondary">
                                Line {suggestion.position + 1}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{suggestion.message}</p>
                            {suggestion.originalText && (
                              <div className="text-xs text-muted-foreground">
                                <strong>Original:</strong> "{suggestion.originalText.substring(0, 100)}..."
                              </div>
                            )}
                            {suggestion.suggestedText && (
                              <div className="text-xs text-green-600">
                                <strong>Suggested:</strong> "{suggestion.suggestedText}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Character Analysis
              </CardTitle>
              <CardDescription>
                Character development and arc analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Character analysis would go here - simplified for length */}
                <p className="text-muted-foreground">
                  Character development tracking and analysis coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Plot Structure
              </CardTitle>
              <CardDescription>
                Three-act structure and pacing analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Plot structure analysis would go here - simplified for length */}
                <p className="text-muted-foreground">
                  Detailed plot structure analysis coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Writing Insights
              </CardTitle>
              <CardDescription>
                Advanced insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Script Statistics</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Total Elements: {elements.length}</p>
                      <p>Scenes: {elements.filter(el => el.type === 'heading').length}</p>
                      <p>Characters: {new Set(elements.filter(el => el.type === 'character').map(el => el.content)).size}</p>
                      <p>Dialogue Lines: {elements.filter(el => el.type === 'dialogue').length}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Improvement Areas</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {analytics.suggestions.slice(0, 3).map((suggestion, index) => (
                        <p key={index}>• {suggestion.type} improvements</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
