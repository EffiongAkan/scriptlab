import { useMemo, useState, useEffect, useRef } from 'react';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { Genre, Language } from '@/types';
import { ModularScriptAnalyzer, AnalysisModuleType } from '@/services/ModularScriptAnalyzer';

export interface PlotHole {
  id: string;
  type: 'timeline' | 'character' | 'logic' | 'continuity';
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  location: string;
  suggestion?: string;
}

export interface CharacterArc {
  name: string;
  scenes: number[];
  development: 'strong' | 'moderate' | 'weak';
  consistency: number;
  motivation: string;
  conflict: string;
}

export interface Theme {
  name: string;
  strength: 'primary' | 'secondary' | 'subtle';
  scenes: string[];
  development: number;
}

export interface PacingIssue {
  type: 'slow' | 'rushed' | 'uneven';
  scene: string;
  description: string;
  suggestion: string;
}

export interface CulturalElement {
  type: 'language' | 'tradition' | 'social' | 'religious';
  accuracy: 'authentic' | 'questionable' | 'inaccurate';
  description: string;
  suggestion?: string;
}

export interface ScriptRecommendation {
  type: 'critical' | 'improvement' | 'strength';
  category: 'plot' | 'character' | 'dialogue' | 'structure' | 'theme';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface EnhancedScriptAnalytics {
  // Basic metrics
  totalElements: number;
  sceneCount: number;
  characterCount: number;
  dialogueCount: number;
  actionCount: number;
  pageEstimate: number;
  readingTime: number;

  // Plot Analysis
  plotHoles: PlotHole[];
  timelineConsistency: number;
  narrativeFlow: number;

  // Character Analysis
  characterArcs: CharacterArc[];
  characterConsistency: number;
  dialogueDistribution: Record<string, number>;

  // Themes Analysis
  themes: Theme[];
  thematicDevelopment: number;

  // Pacing Analysis
  pacingIssues: PacingIssue[];
  sceneBalance: number;
  dialogueActionRatio: number;

  // Cultural Elements
  culturalElements: CulturalElement[];
  culturalAuthenticity: number;

  // Recommendations
  recommendations: ScriptRecommendation[];

  // Overall scores
  overallScore: number;
  strengths: string[];
  criticalIssues: string[];
  isLoading?: boolean;
  moduleLoadingStates: Record<AnalysisModuleType, boolean>;
  moduleErrors: Record<string, string>;
  analysisProgress: { completed: number; total: number };
  error?: string | null;
  premiumAnalysis?: any | null;
}

const DEFAULT_LOADING_STATES: Record<AnalysisModuleType, boolean> = {
  overview: false,
  plot: false,
  character: false,
  pacing: false,
  theme: false,
  cultural: false,
  technical: false,
  industry: false,
  recommendations: false
};

export const useEnhancedScriptAnalytics = (
  elements: ScriptElementType[],
  genre?: Genre,
  language?: Language,
  synopsis?: string,
  industry?: string,
  scriptId?: string
): EnhancedScriptAnalytics & { reanalyze: () => void } => {
  const [isLoading, setIsLoading] = useState(false);
  const [moduleLoadingStates, setModuleLoadingStates] = useState<Record<AnalysisModuleType, boolean>>(DEFAULT_LOADING_STATES);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});
  const [refreshCount, setRefreshCount] = useState(0);
  const analysisInProgress = useRef<string | null>(null);

  const reanalyze = () => {
    console.log('[useEnhancedScriptAnalytics] Manual refresh requested');
    analysisInProgress.current = null;
    setRefreshCount(prev => prev + 1);
  };

  // Trigger modular AI analysis
  useEffect(() => {
    const performModularAnalysis = async () => {
      if (!elements || elements.length === 0) return;

      // Prevent overlapping runs for the same scriptId + version + refresh
      const currentRunId = JSON.stringify({
        scriptId,
        elementCount: elements.length,
        synopsis: synopsis?.substring(0, 50),
        refreshCount
      });

      if (analysisInProgress.current === currentRunId) {
        console.log('[useEnhancedScriptAnalytics] Analysis already in progress/done for this version, skipping.');
        return;
      }
      analysisInProgress.current = currentRunId;

      try {
        setIsLoading(true);
        setError(null);
        setModuleErrors({});

        // 1. Try to load existing analysis from DB first (only if not a manual refresh)
        if (scriptId && refreshCount === 0) {
          console.log(`[useEnhancedScriptAnalytics] Checking stored analysis for ${scriptId}...`);
          const stored = await ModularScriptAnalyzer.getStoredAnalysis(scriptId);
          if (stored && Object.keys(stored).length >= 5) {
            console.log('[useEnhancedScriptAnalytics] Loaded substantial analysis from DB');
            setAiAnalysis(stored);
            setIsLoading(false);
            return;
          }
        }

        // 2. Start modular analysis passes sequentially to avoid rate limits/timeouts
        const modules: AnalysisModuleType[] = [
          'overview', 'plot', 'character', 'pacing',
          'theme', 'cultural', 'technical', 'industry', 'recommendations'
        ];

        setModuleLoadingStates(modules.reduce((acc, mod) => ({ ...acc, [mod]: true }), {} as any));

        for (const moduleType of modules) {
          try {
            console.log(`[useEnhancedScriptAnalytics] Starting analysis for ${moduleType}...`);
            const result = await ModularScriptAnalyzer.analyzeModule(moduleType, elements, {
              genre,
              language,
              synopsis,
              industry,
              scriptId
            });
            setAiAnalysis(prev => ({ ...prev, [moduleType]: result }));
          } catch (err) {
            console.error(`Failed to analyze module ${moduleType}:`, err);
            const msg = err instanceof Error ? err.message : 'Analysis failed';
            setModuleErrors(prev => ({ ...prev, [moduleType]: msg }));
            // Also set a global error if it's a critical module like overview
            if (moduleType === 'overview') setError(`Critical analysis failure: ${msg}`);
          } finally {
            setModuleLoadingStates(prev => ({ ...prev, [moduleType]: false }));
          }
        }
      } catch (error) {
        console.error('Modular AI analysis failed:', error);
        setError(error instanceof Error ? error.message : 'Analysis failed');
      } finally {
        setIsLoading(false);
      }
    };

    performModularAnalysis();
  }, [scriptId, elements.length, genre, language, synopsis, industry, refreshCount]);

  return useMemo((): EnhancedScriptAnalytics & { reanalyze: () => void } => {
    if (!elements || elements.length === 0) {
      return {
        ...getEmptyAnalytics(),
        moduleErrors,
        analysisProgress: { completed: 0, total: 9 },
        reanalyze
      };
    }

    // Basic metrics
    const sceneCount = elements.filter(el => el.type === 'heading').length;
    const characterCount = new Set(
      elements
        .filter(el => el.type === 'character')
        .map(el => el.content.trim().toUpperCase())
    ).size;
    const dialogueCount = elements.filter(el => el.type === 'dialogue').length;
    const actionCount = elements.filter(el => el.type === 'action').length;
    const pageEstimate = Math.ceil(elements.length / 3);
    const readingTime = Math.ceil(elements.length * 0.1);

    // Enhanced analysis using modular AI results
    let plotHoles: PlotHole[] = [];
    let characterArcs: CharacterArc[] = [];
    let themes: Theme[] = [];
    let pacingIssues: PacingIssue[] = [];
    let culturalElements: CulturalElement[] = [];
    let recommendations: ScriptRecommendation[] = [];

    let timelineConsistency = 0;
    let narrativeFlow = 0;
    let characterConsistency = 0;
    let thematicDevelopment = 0;
    let sceneBalance = 0;
    let culturalAuthenticity = 0;
    let overallScore = 0;
    let strengths: string[] = [];
    let criticalIssues: string[] = [];

    // Map modular results to hook format
    if (aiAnalysis.plot) {
      plotHoles = aiAnalysis.plot.plotHoles.map((hole: any, index: number) => ({
        id: `ai-plot-${index}`,
        type: 'logic',
        severity: hole.severity,
        description: hole.description,
        location: hole.location,
        suggestion: hole.solution
      }));
      narrativeFlow = aiAnalysis.plot.narrativeFlow.length > 50 ? 85 : 65;
    }

    if (aiAnalysis.character) {
      characterArcs = aiAnalysis.character.characterBreakdown.map((char: any) => ({
        name: char.name,
        scenes: [],
        development: char.consistency > 80 ? 'strong' : char.consistency > 50 ? 'moderate' : 'weak',
        consistency: char.consistency,
        motivation: char.arc,
        conflict: char.relationshipDynamics
      }));
      characterConsistency = aiAnalysis.character.dialogueQuality.voiceConsistency;
    }

    if (aiAnalysis.theme) {
      themes = aiAnalysis.theme.primaryThemes.map((theme: string) => ({
        name: theme,
        strength: 'primary',
        scenes: [],
        development: 80
      }));
      thematicDevelopment = aiAnalysis.theme.thematicResonance.length > 50 ? 82 : 62;
    }

    if (aiAnalysis.pacing) {
      pacingIssues = aiAnalysis.pacing.slowPoints.map((issue: any) => ({
        type: 'slow',
        scene: issue.location,
        description: issue.issue,
        suggestion: issue.solution
      }));
      sceneBalance = aiAnalysis.pacing.overallRhythm.length > 50 ? 80 : 60;
    }

    if (aiAnalysis.cultural) {
      culturalElements = aiAnalysis.cultural.culturalElements.map((el: any) => ({
        type: 'tradition',
        accuracy: el.accuracy,
        description: el.element,
        suggestion: el.feedback
      }));
      culturalAuthenticity = aiAnalysis.cultural.authenticityAssessment.length > 50 ? 88 : 68;
    }

    if (aiAnalysis.recommendations) {
      recommendations = aiAnalysis.recommendations.recommendations.map((rec: any) => ({
        type: rec.priority === 'critical' ? 'critical' as const : 'improvement' as const,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        priority: rec.priority === 'critical' || rec.priority === 'high' ? 'high' as const : 'medium' as const
      }));
    }

    if (aiAnalysis.overview) {
      overallScore = aiAnalysis.overview.overallScore;
    }

    if (aiAnalysis.technical) {
      strengths = [
        aiAnalysis.technical.writingQuality,
        aiAnalysis.technical.sceneCraft
      ].filter(s => s && s.length > 5);
    }

    // Fallbacks if AI not yet loaded
    if (!aiAnalysis.plot) plotHoles = analyzeePlotHoles(elements);
    if (!aiAnalysis.character) characterArcs = analyzeCharacterArcs(elements);
    if (!aiAnalysis.overview) overallScore = calculateOverallScore({
      timelineConsistency: 80,
      narrativeFlow: 75,
      characterConsistency: 85,
      thematicDevelopment: 70,
      sceneBalance: 80,
      culturalAuthenticity: 70
    });

    const dialogueDistribution = calculateDialogueDistribution(elements);
    const dialogueActionRatio = actionCount > 0 ? dialogueCount / actionCount : 0;

    return {
      totalElements: elements.length,
      sceneCount,
      characterCount,
      dialogueCount,
      actionCount,
      pageEstimate,
      readingTime,
      plotHoles,
      timelineConsistency: timelineConsistency || 75,
      narrativeFlow: narrativeFlow || 75,
      characterArcs,
      characterConsistency: characterConsistency || 80,
      dialogueDistribution,
      themes,
      thematicDevelopment: thematicDevelopment || 70,
      pacingIssues,
      sceneBalance: sceneBalance || 80,
      dialogueActionRatio,
      culturalElements,
      culturalAuthenticity: culturalAuthenticity || 70,
      recommendations,
      overallScore,
      strengths,
      criticalIssues,
      isLoading,
      moduleLoadingStates,
      error,
      premiumAnalysis: {
        overview: aiAnalysis.overview || { executiveSummary: 'Analyzing...', overallScore: 0, marketViability: '', targetAudience: '', commercialPotential: '' },
        plotAnalysis: aiAnalysis.plot ? {
          // Map new simplified structure to old format for backward compatibility
          structureBreakdown: aiAnalysis.plot.structureAssessment || '',
          threeActAnalysis: aiAnalysis.plot.actBreakdown?.map((act: any) =>
            `Act ${act.act} (${act.pageRange}): ${act.summary}\nStrengths: ${act.strengths}\nWeaknesses: ${act.weaknesses}`
          ).join('\n\n') || '',
          plotHoles: aiAnalysis.plot.plotHoles || [],
          narrativeFlow: aiAnalysis.plot.narrativeFlow || '',
          subplotIntegration: aiAnalysis.plot.subplots?.map((sp: any) =>
            `${sp.description} (Integration: ${sp.integration}/10) - ${sp.suggestions}`
          ).join('\n\n') || '',
          climaxEffectiveness: aiAnalysis.plot.keyMoments?.climax || '',
          // Include all new fields
          ...aiAnalysis.plot
        } : {
          structureBreakdown: '',
          threeActAnalysis: '',
          plotHoles: [],
          narrativeFlow: '',
          subplotIntegration: '',
          climaxEffectiveness: ''
        },
        characterAnalysis: aiAnalysis.character || { arcAnalysis: '', characterBreakdown: [], dialogueQuality: { analysis: '', strengths: [], improvements: [], voiceConsistency: 0 } },
        pacingAnalysis: aiAnalysis.pacing || { overallRhythm: '', sceneByScenePacing: '', tensionCurve: '', slowPoints: [], highlights: [] },
        themeAnalysis: aiAnalysis.theme || { primaryThemes: [], themeExecution: '', thematicResonance: '', subtextAnalysis: '', symbolismUsage: '' },
        culturalAnalysis: aiAnalysis.cultural || { authenticityAssessment: '', culturalElements: [], representationQuality: '', improvementSuggestions: [] },
        technicalAssessment: aiAnalysis.technical || { formatting: '', sceneCraft: '', writingQuality: '', professionalReadiness: '' },
        industryComparison: aiAnalysis.industry || { genreConventions: '', competitiveAnalysis: '', marketPositioning: '', festivalPotential: '' },
        actionableRecommendations: aiAnalysis.recommendations?.recommendations || []
      },
      moduleErrors,
      analysisProgress: {
        completed: Object.keys(aiAnalysis).length,
        total: 9
      },
      reanalyze
    };
  }, [elements, aiAnalysis, isLoading, error, moduleErrors, refreshCount]);
};

// Helper functions (kept from original)
function getEmptyAnalytics(): EnhancedScriptAnalytics {
  return {
    totalElements: 0,
    sceneCount: 0,
    characterCount: 0,
    dialogueCount: 0,
    actionCount: 0,
    pageEstimate: 0,
    readingTime: 0,
    plotHoles: [],
    timelineConsistency: 100,
    narrativeFlow: 100,
    characterArcs: [],
    characterConsistency: 100,
    dialogueDistribution: {},
    themes: [],
    thematicDevelopment: 0,
    pacingIssues: [],
    sceneBalance: 100,
    dialogueActionRatio: 0,
    culturalElements: [],
    culturalAuthenticity: 100,
    recommendations: [],
    overallScore: 100,
    strengths: [],
    criticalIssues: [],
    moduleLoadingStates: DEFAULT_LOADING_STATES,
    moduleErrors: {},
    analysisProgress: { completed: 0, total: 9 }
  };
}

function analyzeePlotHoles(elements: ScriptElementType[]): PlotHole[] {
  const plotHoles: PlotHole[] = [];
  const introducedCharacters = new Set<string>();
  const characterReferences = new Map<string, number>();

  elements.forEach((element, index) => {
    if (element.type === 'character') {
      const charName = element.content.trim().toUpperCase();
      if (!introducedCharacters.has(charName) && characterReferences.has(charName)) {
        plotHoles.push({
          id: `char-intro-${index}`,
          type: 'character',
          severity: 'moderate',
          description: `Character "${charName}" appears without proper introduction`,
          location: `Element ${index + 1}`,
          suggestion: 'Consider adding character introduction or establishing scene'
        });
      }
      introducedCharacters.add(charName);
    }
  });
  return plotHoles;
}

function calculateDialogueDistribution(elements: ScriptElementType[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].type === 'character' && i + 1 < elements.length && elements[i + 1].type === 'dialogue') {
      const charName = elements[i].content.trim().toUpperCase();
      distribution[charName] = (distribution[charName] || 0) + 1;
    }
  }
  return distribution;
}

function analyzeCharacterArcs(elements: ScriptElementType[]): CharacterArc[] {
  return []; // Simplified for brevity in hook
}

function calculateOverallScore(metrics: any): number {
  const scores = Object.values(metrics) as number[];
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}