import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, FileText, Users, MessageSquare, Zap, TrendingUp, Loader } from 'lucide-react';
import { PremiumScriptAnalyzer, PremiumAnalysisResult } from '@/services/premium-script-analysis';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { Genre, Language } from '@/types';

interface ScriptAnalysisOverviewProps {
  elements: ScriptElementType[];
  genre?: Genre;
  language?: Language;
  synopsis?: string;
  industry?: string;
  analysis?: PremiumAnalysisResult | null;
}

export const ScriptAnalysisOverview: React.FC<ScriptAnalysisOverviewProps> = ({
  elements,
  genre,
  language,
  synopsis,
  industry,
  analysis: providedAnalysis
}) => {
  const [analysis, setAnalysis] = useState<PremiumAnalysisResult | null>(providedAnalysis || null);
  const [loading, setLoading] = useState(!providedAnalysis);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providedAnalysis) {
      setAnalysis(providedAnalysis);
      setLoading(false);
    }
  }, [providedAnalysis]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Performing comprehensive AI analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No script content to analyze</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate basic metrics
  const sceneCount = elements.filter(el => el.type === 'heading').length;
  const characterCount = new Set(elements.filter(el => el.type === 'character').map(el => el.content.trim())).size;

  // Industry standard approach for estimation
  const pageEstimate = Math.max(1, Math.ceil(elements.length / 50));
  const readingTime = pageEstimate; // Roughly 1 minute per page

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{analysis.overview.executiveSummary}</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Overall Score</span>
              <Badge variant={getScoreBadgeVariant(analysis.overview.overallScore)}>
                {analysis.overview.overallScore}/100
              </Badge>
            </div>
            <Progress value={analysis.overview.overallScore} className="h-3" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">Market Viability</h4>
                <p className="text-sm text-muted-foreground">{analysis.overview.marketViability}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-purple-600">Target Audience</h4>
                <p className="text-sm text-muted-foreground">{analysis.overview.targetAudience}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Commercial Potential</h4>
                <p className="text-sm text-muted-foreground">{analysis.overview.commercialPotential}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pages</p>
                <p className="text-lg font-semibold">{pageEstimate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Characters</p>
                <p className="text-lg font-semibold">{characterCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Scenes</p>
                <p className="text-lg font-semibold">{sceneCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Read Time</p>
                <p className="text-lg font-semibold">{readingTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Industry Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Genre Conventions</h4>
                <p className="text-sm text-muted-foreground">{analysis.industryComparison.genreConventions}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Market Positioning</h4>
                <p className="text-sm text-muted-foreground">{analysis.industryComparison.marketPositioning}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Competitive Analysis</h4>
                <p className="text-sm text-muted-foreground">{analysis.industryComparison.competitiveAnalysis}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Festival Potential</h4>
                <p className="text-sm text-muted-foreground">{analysis.industryComparison.festivalPotential}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Script Formatting</h4>
                <p className="text-sm text-muted-foreground">{analysis.technicalAssessment.formatting}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Scene Craft</h4>
                <p className="text-sm text-muted-foreground">{analysis.technicalAssessment.sceneCraft}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Writing Quality</h4>
                <p className="text-sm text-muted-foreground">{analysis.technicalAssessment.writingQuality}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Professional Readiness</h4>
                <p className="text-sm text-muted-foreground">{analysis.technicalAssessment.professionalReadiness}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};