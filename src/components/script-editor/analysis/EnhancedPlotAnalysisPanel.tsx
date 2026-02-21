import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Loader, BookOpen, Zap, Target, TrendingUp } from 'lucide-react';
import { ImprovedScriptAnalyzer, ComprehensiveAnalysisResult } from '@/services/improved-script-analysis';
import { PremiumAnalysisResult } from '@/services/premium-script-analysis';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface EnhancedPlotAnalysisPanelProps {
  elements: ScriptElementType[];
  analysis?: PremiumAnalysisResult | null;
}

export const EnhancedPlotAnalysisPanel: React.FC<EnhancedPlotAnalysisPanelProps> = ({
  elements,
  analysis: providedAnalysis
}) => {
  const [analysis, setAnalysis] = useState<PremiumAnalysisResult | null>(providedAnalysis || null);
  const [loading, setLoading] = useState(!providedAnalysis);

  useEffect(() => {
    if (providedAnalysis) {
      setAnalysis(providedAnalysis);
      setLoading(false);
    }
  }, [providedAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Analyzing plot structure...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Plot analysis unavailable</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'moderate': return 'text-orange-500';
      case 'minor': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'moderate': return 'secondary';
      case 'minor': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Three-Act Structure Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Three-Act Structure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{analysis.plotAnalysis.threeActAnalysis}</p>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Structure Breakdown</h4>
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-sm">{analysis.plotAnalysis.structureBreakdown}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plot Holes Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Plot Holes ({analysis.plotAnalysis.plotHoles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.plotAnalysis.plotHoles.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-green-600 mb-2">No Major Plot Holes Detected!</h3>
              <p className="text-sm text-muted-foreground">Your story maintains logical consistency throughout.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analysis.plotAnalysis.plotHoles.map((hole, index) => (
                <Alert key={index} className={`border-l-4 ${hole.severity === 'critical' ? 'border-red-500' :
                  hole.severity === 'moderate' ? 'border-orange-500' : 'border-yellow-500'
                  }`}>
                  <AlertTriangle className={`h-4 w-4 ${getSeverityColor(hole.severity)}`} />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadge(hole.severity) as any}>
                          {hole.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm">{hole.description}</span>
                      </div>
                      {hole.location && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Location:</strong> {hole.location}
                        </p>
                      )}
                      {hole.solution && (
                        <p className="text-xs bg-muted/50 p-2 rounded">
                          <strong>Suggested Solution:</strong> {hole.solution}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Narrative Flow & Pacing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Narrative Flow & Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-sm mb-3">Narrative Flow</h4>
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm leading-relaxed">{analysis.plotAnalysis.narrativeFlow}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Subplot Integration</h4>
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm leading-relaxed">{analysis.plotAnalysis.subplotIntegration}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Climax Effectiveness</h4>
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm leading-relaxed">{analysis.plotAnalysis.climaxEffectiveness}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Plot Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {elements.filter(el => el.type === 'heading').length}
              </div>
              <div className="text-xs text-muted-foreground">Scenes</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {analysis.plotAnalysis.plotHoles.filter(h => h.severity === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">Critical Issues</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {analysis.plotAnalysis.plotHoles.filter(h => h.severity === 'moderate').length}
              </div>
              <div className="text-xs text-muted-foreground">Moderate Issues</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {analysis.plotAnalysis.plotHoles.filter(h => h.severity === 'minor').length}
              </div>
              <div className="text-xs text-muted-foreground">Minor Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};