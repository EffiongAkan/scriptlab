import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, DollarSign, Award, Loader, Film, Users, Calendar } from 'lucide-react';
import { PremiumScriptAnalyzer, PremiumAnalysisResult } from '@/services/premium-script-analysis';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { Genre, Language } from '@/types';

interface IndustryAnalysisPanelProps {
  elements: ScriptElementType[];
  analysis?: PremiumAnalysisResult | null;
  genre?: Genre;
  language?: Language;
  synopsis?: string;
  industry?: string;
}

export const IndustryAnalysisPanel: React.FC<IndustryAnalysisPanelProps> = ({
  elements,
  analysis: providedAnalysis,
  genre,
  language,
  synopsis,
  industry
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
        <span className="ml-2">Analyzing industry positioning...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Industry analysis unavailable</p>
      </div>
    );
  }

  const getViabilityColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('strong') || lower.includes('high') || lower.includes('excellent')) return 'text-green-500';
    if (lower.includes('moderate') || lower.includes('good')) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getViabilityBadge = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('strong') || lower.includes('high') || lower.includes('excellent')) return 'default';
    if (lower.includes('moderate') || lower.includes('good')) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Market Viability Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Market Viability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{analysis.overview.marketViability}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Target Audience
                </h4>
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-sm">{analysis.overview.targetAudience}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Commercial Potential
                </h4>
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-sm">{analysis.overview.commercialPotential}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Genre & Competition Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-purple-500" />
            Genre & Competition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-sm mb-3">Genre Conventions</h4>
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm leading-relaxed">{analysis.industryComparison.genreConventions}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Competitive Analysis</h4>
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm leading-relaxed">{analysis.industryComparison.competitiveAnalysis}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Market Positioning</h4>
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm leading-relaxed">{analysis.industryComparison.marketPositioning}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Festival & Distribution Potential */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Festival & Distribution Potential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{analysis.industryComparison.festivalPotential}</p>
            </div>

            {/* Add distribution insights if available */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Film className="h-6 w-6 text-blue-600" />
                </div>
                <h5 className="font-medium text-sm">Film Festivals</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.industryComparison.festivalPotential.includes('strong') ? 'High Potential' : 'Moderate Potential'}
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h5 className="font-medium text-sm">Streaming Platforms</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.overview.commercialPotential.includes('streaming') ? 'Suitable' : 'Needs Assessment'}
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <h5 className="font-medium text-sm">Theatrical Release</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.overview.commercialPotential.includes('theatrical') ? 'Viable' : 'Limited'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};