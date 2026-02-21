import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, FileText, Pen, Star, Loader } from 'lucide-react';
import { PremiumScriptAnalyzer, PremiumAnalysisResult } from '@/services/premium-script-analysis';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface ProfessionalReadinessPanelProps {
  elements: ScriptElementType[];
  analysis?: PremiumAnalysisResult | null;
}

export const ProfessionalReadinessPanel: React.FC<ProfessionalReadinessPanelProps> = ({
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
        <span className="ml-2">Evaluating professional readiness...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Professional readiness analysis unavailable</p>
      </div>
    );
  }

  const getReadinessScore = (text: string): number => {
    const lower = text.toLowerCase();
    if (lower.includes('excellent') || lower.includes('professional') || lower.includes('ready')) return 85;
    if (lower.includes('good') || lower.includes('solid')) return 70;
    if (lower.includes('needs improvement') || lower.includes('requires')) return 50;
    return 60;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const formattingScore = getReadinessScore(analysis.technicalAssessment.formatting);
  const sceneCraftScore = getReadinessScore(analysis.technicalAssessment.sceneCraft);
  const writingQualityScore = getReadinessScore(analysis.technicalAssessment.writingQuality);
  const professionalScore = getReadinessScore(analysis.technicalAssessment.professionalReadiness);

  const overallReadiness = Math.round((formattingScore + sceneCraftScore + writingQualityScore + professionalScore) / 4);

  return (
    <div className="space-y-6">
      {/* Overall Professional Readiness Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Professional Readiness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Overall Readiness</span>
              <Badge variant={getScoreBadge(overallReadiness)}>
                {overallReadiness}/100
              </Badge>
            </div>
            <Progress value={overallReadiness} className="h-3" />

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{analysis.technicalAssessment.professionalReadiness}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Assessment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Technical Assessment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Script Formatting */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {getIcon(formattingScore)}
                  Script Formatting
                </h4>
                <Badge variant={getScoreBadge(formattingScore)}>
                  {formattingScore}/100
                </Badge>
              </div>
              <Progress value={formattingScore} className="h-2" />
              <div className="bg-muted/20 p-3 rounded-md">
                <p className="text-sm">{analysis.technicalAssessment.formatting}</p>
              </div>
            </div>

            {/* Scene Craft */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {getIcon(sceneCraftScore)}
                  Scene Craft
                </h4>
                <Badge variant={getScoreBadge(sceneCraftScore)}>
                  {sceneCraftScore}/100
                </Badge>
              </div>
              <Progress value={sceneCraftScore} className="h-2" />
              <div className="bg-muted/20 p-3 rounded-md">
                <p className="text-sm">{analysis.technicalAssessment.sceneCraft}</p>
              </div>
            </div>

            {/* Writing Quality */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {getIcon(writingQualityScore)}
                  Writing Quality
                </h4>
                <Badge variant={getScoreBadge(writingQualityScore)}>
                  {writingQualityScore}/100
                </Badge>
              </div>
              <Progress value={writingQualityScore} className="h-2" />
              <div className="bg-muted/20 p-3 rounded-md">
                <p className="text-sm">{analysis.technicalAssessment.writingQuality}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pen className="h-5 w-5 text-purple-500" />
            Priority Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.actionableRecommendations
              .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
              .slice(0, 5)
              .map((rec, index) => (
                <div key={index} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                    <h5 className="font-medium text-sm">{rec.title}</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  {rec.specificSteps.length > 0 && (
                    <ul className="text-xs space-y-1">
                      {rec.specificSteps.slice(0, 3).map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            }

            {analysis.actionableRecommendations.filter(rec => rec.priority === 'critical' || rec.priority === 'high').length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No critical issues found. Your script meets professional standards!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};