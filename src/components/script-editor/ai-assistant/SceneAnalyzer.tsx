import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, TrendingUp, Clock, Target, AlertTriangle } from 'lucide-react';
import { generateDeepseekContent } from '@/services/deepseek-ai-service';

interface SceneAnalysis {
  id: string;
  sceneTitle: string;
  pacing: number;
  tension: number;
  characterDevelopment: number;
  culturalAuthenticity: number;
  issues: string[];
  suggestions: string[];
  wordCount: number;
  estimatedTime: string;
}

interface SceneAnalyzerProps {
  scriptId: string;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
}

export const SceneAnalyzer: React.FC<SceneAnalyzerProps> = ({
  scriptId,
  elements,
  onApplySuggestion,
  isGenerating,
  onGenerate
}) => {
  const [analyses, setAnalyses] = useState<SceneAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyzeCurrentScene = async () => {
    setLoading(true);
    // Aggregate the scene to analyze (simulate as: last heading and all after until next heading)
    const lastHeadingIndex = [...elements].reverse().findIndex(el => el.type === 'heading');
    let startIdx = lastHeadingIndex === -1 ? 0 : elements.length - 1 - lastHeadingIndex;
    const sceneSlice = elements.slice(startIdx);
    const sceneText = sceneSlice.map(el => el.content).join('\n');

    const { content, success } = await generateDeepseekContent({
      prompt: `Analyze this script scene for pacing, dramatic tension, character development, and Nigerian cultural authenticity. List detected issues and suggestions, give metrics for pacing, tension, character development, cultural authenticity (0-100). Also estimate word count and screen time.\n\nScene:\n${sceneText}`,
      feature: 'scene',
      maxTokens: 350,
      temperature: 0.7
    });
    setLoading(false);
    if (success && content) {
      // Try to parse for metrics, issues, suggestions. 
      // This is loose, expects Deepseek to roughly format these items
      const metrics: any = {};
      const issues: string[] = [];
      const suggestions: string[] = [];
      let wordCount = sceneText.split(/\s+/).length;
      let estimatedTime = Math.max(1, Math.round(wordCount / 120)) + ' min';

      // Try pattern matching
      const num = (str: string) => {
        const m = str.match(/\d+/);
        return m ? parseInt(m[0], 10) : 60;
      };
      content.split('\n').forEach(line => {
        if (/pacing/i.test(line)) metrics.pacing = num(line);
        if (/tension/i.test(line)) metrics.tension = num(line);
        if (/character development/i.test(line)) metrics.characterDevelopment = num(line);
        if (/cultural authenticity/i.test(line)) metrics.culturalAuthenticity = num(line);
        if (/word count/i.test(line)) wordCount = num(line);
        if (/estimated time/i.test(line)) estimatedTime = line.split(':')[1] || estimatedTime;
        if (/issue/i.test(line) && !/no issue/.test(line)) issues.push(line.replace(/issue[s]?:?/i, '').trim());
        if (/suggestion/i.test(line)) suggestions.push(line.replace(/suggestion[s]?:?/i, '').trim());
      });

      setAnalyses([
        {
          id: Date.now().toString(),
          sceneTitle: (sceneSlice[0]?.content || 'Current Scene').substring(0, 40),
          pacing: metrics.pacing || 60,
          tension: metrics.tension || 60,
          characterDevelopment: metrics.characterDevelopment || 60,
          culturalAuthenticity: metrics.culturalAuthenticity || 60,
          issues,
          suggestions,
          wordCount,
          estimatedTime
        },
        ...analyses,
      ]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Scene Structure Analyzer
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeCurrentScene}
            disabled={loading || isGenerating}
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analyzing..." : "Analyze Current"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-6">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">{analysis.sceneTitle}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {analysis.estimatedTime}
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pacing</span>
                      <span className={getScoreColor(analysis.pacing)}>{analysis.pacing}%</span>
                    </div>
                    <Progress 
                      value={analysis.pacing} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tension</span>
                      <span className={getScoreColor(analysis.tension)}>{analysis.tension}%</span>
                    </div>
                    <Progress 
                      value={analysis.tension} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Character Dev</span>
                      <span className={getScoreColor(analysis.characterDevelopment)}>{analysis.characterDevelopment}%</span>
                    </div>
                    <Progress 
                      value={analysis.characterDevelopment} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cultural Auth</span>
                      <span className={getScoreColor(analysis.culturalAuthenticity)}>{analysis.culturalAuthenticity}%</span>
                    </div>
                    <Progress 
                      value={analysis.culturalAuthenticity} 
                      className="h-2"
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <span>{analysis.wordCount} words</span>
                  <span>•</span>
                  <span>{analysis.estimatedTime} screen time</span>
                </div>
                
                {/* Issues */}
                {analysis.issues.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Issues Detected</span>
                    </div>
                    <div className="space-y-1">
                      {analysis.issues.map((issue, index) => (
                        <div key={index} className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Suggestions */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">AI Suggestions</span>
                  </div>
                  <div className="space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Apply All Suggestions
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleAnalyzeCurrentScene}>
                    Re-analyze
                  </Button>
                </div>
              </div>
            ))}
            {analyses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No analyses yet. Click "Analyze Current" to start.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
