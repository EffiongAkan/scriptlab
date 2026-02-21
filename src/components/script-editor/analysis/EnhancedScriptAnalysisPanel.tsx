import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw, Download, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { useEnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';
import { ScriptAnalysisOverview } from './ScriptAnalysisOverview';
import { EnhancedPlotAnalysisPanel } from './EnhancedPlotAnalysisPanel';
import { CharacterAnalysisPanel } from './CharacterAnalysisPanel';
import { RecommendationsPanel } from './RecommendationsPanel';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { PacingAnalysisPanel } from './PacingAnalysisPanel';
import { ThemesAnalysisPanel } from './ThemesAnalysisPanel';
import { CulturalElementsPanel } from './CulturalElementsPanel';
import { EmotionalImpactPanel } from './EmotionalImpactPanel';
import { IndustryAnalysisPanel } from './IndustryAnalysisPanel';
import { ProfessionalReadinessPanel } from './ProfessionalReadinessPanel';
import { Genre, Language } from '@/types';
import { exportScriptAnalysis } from '@/utils/exportScriptAnalysis';
import { exportScriptAnalysisToPDF } from '@/utils/exportScriptAnalysisPDF';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useParams } from 'react-router-dom';

interface EnhancedScriptAnalysisPanelProps {
  elements: ScriptElementType[];
  genre?: Genre;
  language?: Language;
  onApplySuggestion?: (elementId: string, newContent: string) => void;
  synopsis?: string;
  industry?: string;
}

export const EnhancedScriptAnalysisPanel: React.FC<EnhancedScriptAnalysisPanelProps> = ({
  elements,
  genre,
  language,
  onApplySuggestion,
  synopsis,
  industry
}) => {
  const { scriptId } = useParams<{ scriptId: string }>();

  const { data: scriptData } = useQuery({
    queryKey: ['script', scriptId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scripts')
        .select('title')
        .eq('id', scriptId)
        .single();
      return data;
    },
    enabled: !!scriptId
  });

  const analytics = useEnhancedScriptAnalytics(
    elements,
    genre,
    language,
    synopsis,
    industry,
    scriptId
  );

  const isLoading = analytics.isLoading;
  const { moduleLoadingStates, error } = analytics;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    plot: false,
    characters: false,
    industry: false,
    professional: false,
    pacing: false,
    themes: false,
    cultural: false,
    emotional: false,
    recommendations: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExportMarkdown = () => {
    exportScriptAnalysis(analytics, scriptData?.title || 'Script');
  };

  const handleExportPDF = () => {
    exportScriptAnalysisToPDF(analytics, scriptData?.title || 'Script');
  };

  const sections = [
    { key: 'overview', module: 'overview', title: 'Overall Assessment', component: <ScriptAnalysisOverview elements={elements} genre={genre} language={language} synopsis={synopsis} industry={industry} analysis={analytics.premiumAnalysis} /> },
    { key: 'plot', module: 'plot', title: 'Plot Analysis', component: <EnhancedPlotAnalysisPanel elements={elements} analysis={analytics.premiumAnalysis} /> },
    { key: 'characters', module: 'character', title: 'Character Analysis', component: <CharacterAnalysisPanel elements={elements} genre={genre} language={language} analysis={analytics.premiumAnalysis} /> },
    { key: 'industry', module: 'industry', title: 'Industry Analysis', component: <IndustryAnalysisPanel elements={elements} genre={genre} language={language} synopsis={synopsis} industry={industry} analysis={analytics.premiumAnalysis} /> },
    { key: 'professional', module: 'technical', title: 'Professional Readiness', component: <ProfessionalReadinessPanel elements={elements} analysis={analytics.premiumAnalysis} /> },
    { key: 'pacing', module: 'pacing', title: 'Pacing Analysis', component: <PacingAnalysisPanel analytics={analytics} /> },
    { key: 'themes', module: 'theme', title: 'Themes & Subtext', component: <ThemesAnalysisPanel analytics={analytics} /> },
    { key: 'cultural', module: 'cultural', title: 'Cultural Authenticity', component: <CulturalElementsPanel analytics={analytics} /> },
    { key: 'recommendations', module: 'recommendations', title: 'Professional Recommendations', component: <RecommendationsPanel analytics={analytics} /> },
  ];

  return (
    <div className="bg-slate-800 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Script Analysis
            {isLoading && <Loader2 className="h-6 w-6 animate-spin text-naija-green" />}
          </h1>
          <div className="flex items-center gap-4">
            {!isLoading && analytics.analysisProgress.completed < analytics.analysisProgress.total && (
              <span className="text-sm text-slate-400">
                {analytics.analysisProgress.completed}/{analytics.analysisProgress.total} sections complete
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-500/10 text-blue-400 border-blue-500 hover:bg-blue-500 hover:text-white"
                  disabled={isLoading || analytics.analysisProgress.completed === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Analysis
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="bg-naija-green/10 text-naija-green border-naija-green hover:bg-naija-green hover:text-white"
              onClick={() => analytics.reanalyze()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing ({analytics.analysisProgress.completed}/{analytics.analysisProgress.total})...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {Object.keys(analytics.moduleErrors).length > 0 && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Partial Analysis Failure</AlertTitle>
            <AlertDescription>
              Some sections could not be analyzed. You can try refreshing individual sections or the whole script.
              <ul className="mt-2 text-xs list-disc list-inside opacity-80">
                {Object.entries(analytics.moduleErrors).map(([mod, err]) => (
                  <li key={mod}><span className="font-semibold uppercase">{mod}:</span> {err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {error && !analytics.moduleErrors['overview'] && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-0 border-t border-slate-600">
          {sections.map(({ key, module, title, component }) => (
            <Collapsible key={key} open={openSections[key]} onOpenChange={() => toggleSection(key)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-4 border-b border-slate-600 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-medium text-left">{title}</h2>
                  {moduleLoadingStates[module as any] && (
                    <Loader2 className="h-4 w-4 animate-spin text-naija-green" />
                  )}
                </div>
                {openSections[key] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-6 pt-4">
                {moduleLoadingStates[module as any] && !analytics.premiumAnalysis?.[module] ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-sm">AI is analyzing this section...</p>
                  </div>
                ) : analytics.moduleErrors[module as any] ? (
                  <Alert variant="destructive" className="bg-red-900/10 border-red-900/50 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Module Error</AlertTitle>
                    <AlertDescription>
                      {analytics.moduleErrors[module as any]}
                    </AlertDescription>
                  </Alert>
                ) : (
                  component
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
};