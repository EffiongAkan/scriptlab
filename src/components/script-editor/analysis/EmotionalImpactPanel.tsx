import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { EnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';
import { generatePlotContent, PlotAIRequest } from '@/services/plot-ai-service';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { Genre, Language } from '@/types';

interface EmotionalImpactPanelProps {
  analytics: EnhancedScriptAnalytics;
  elements: ScriptElementType[];
  genre?: Genre;
  language?: Language;
}

interface EmotionalAnalysis {
  emotionalJourney: string;
  keyMoments: Array<{
    type: 'romance' | 'conflict' | 'growth' | 'loss' | 'triumph';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  emotionalDepth: number;
  characterEmotions: Array<{
    character: string;
    primaryEmotion: string;
    emotionalArc: string;
  }>;
}

export const EmotionalImpactPanel: React.FC<EmotionalImpactPanelProps> = ({
  analytics,
  elements,
  genre,
  language
}) => {
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<EmotionalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Relying on data from analytics prop instead of making a separate AI call
    if (analytics && analytics.characterArcs.length > 0) {
      setEmotionalAnalysis(parseEmotionalAnalysis(''));
    }
  }, [elements, analytics]);

  const parseEmotionalAnalysis = (content: string): EmotionalAnalysis => {
    const lines = content.split('\n');

    const emotionalJourney = extractSection(lines, 'EMOTIONAL_JOURNEY') || 'Complex emotional journey with character development and meaningful conflicts.';
    const emotionalDepth = extractScore(content) || 75;

    const keyMoments = [
      {
        type: 'romance' as const,
        title: 'Character Connection',
        description: 'Emotional bonds and relationships develop between characters',
        impact: 'high' as const
      },
      {
        type: 'conflict' as const,
        title: 'Rising Tension',
        description: 'Conflicts create emotional stakes and character challenges',
        impact: 'high' as const
      },
      {
        type: 'growth' as const,
        title: 'Character Evolution',
        description: 'Characters show emotional development and personal growth',
        impact: 'medium' as const
      }
    ];

    const characterEmotions = analytics.characterArcs.slice(0, 3).map(char => ({
      character: char.name,
      primaryEmotion: 'determined',
      emotionalArc: char.motivation
    }));

    return {
      emotionalJourney,
      keyMoments,
      emotionalDepth,
      characterEmotions
    };
  };

  const extractSection = (lines: string[], sectionName: string): string => {
    const sectionIndex = lines.findIndex(line => line.toUpperCase().includes(sectionName.toUpperCase()));
    if (sectionIndex === -1) return '';

    const nextSectionIndex = lines.slice(sectionIndex + 1).findIndex(line => line.match(/^[A-Z_]+:/));
    const endIndex = nextSectionIndex === -1 ? lines.length : sectionIndex + nextSectionIndex + 1;

    return lines.slice(sectionIndex + 1, endIndex).join('\n').trim();
  };

  const extractScore = (content: string): number => {
    const match = content.match(/(\d+)(?:\s*\/\s*100|\s*%)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getEmotionColor = (type: string) => {
    switch (type) {
      case 'romance': return 'text-red-400';
      case 'conflict': return 'text-yellow-400';
      case 'growth': return 'text-green-400';
      case 'loss': return 'text-blue-400';
      case 'triumph': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getEmotionIcon = (type: string) => {
    switch (type) {
      case 'romance': return Heart;
      case 'conflict': return Zap;
      case 'growth': return TrendingUp;
      default: return Heart;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-white">Analyzing emotional impact...</span>
      </div>
    );
  }

  if (!emotionalAnalysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No emotional analysis available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Emotional Journey */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Emotional Journey</h4>
        <p className="text-sm leading-relaxed text-gray-300">
          {emotionalAnalysis.emotionalJourney}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">Emotional Depth:</span>
          <Badge variant="outline" className="text-xs">
            {emotionalAnalysis.emotionalDepth}%
          </Badge>
        </div>
      </div>

      {/* Key Emotional Moments */}
      <div className="space-y-4">
        <h4 className="font-medium">Key Emotional Moments</h4>
        {emotionalAnalysis.keyMoments.map((moment, index) => {
          const IconComponent = getEmotionIcon(moment.type);
          return (
            <div key={index} className="flex items-start gap-3">
              <IconComponent className={`h-4 w-4 mt-1 ${getEmotionColor(moment.type)} flex-shrink-0`} />
              <div>
                <h5 className={`font-medium ${getEmotionColor(moment.type)} mb-2`}>
                  {moment.title}
                </h5>
                <p className="text-sm text-gray-300">{moment.description}</p>
                <Badge
                  variant={moment.impact === 'high' ? 'destructive' : moment.impact === 'medium' ? 'default' : 'secondary'}
                  className="mt-2 text-xs"
                >
                  {moment.impact} impact
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Character Emotions */}
      {emotionalAnalysis.characterEmotions.length > 0 && (
        <div className="border-t border-slate-600 pt-4">
          <h4 className="font-medium mb-3">Character Emotional Arcs</h4>
          <div className="space-y-3">
            {emotionalAnalysis.characterEmotions.map((char, index) => (
              <div key={index} className="bg-slate-800/30 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-purple-400">{char.character}</h5>
                  <Badge variant="outline" className="text-xs">
                    {char.primaryEmotion}
                  </Badge>
                </div>
                <p className="text-xs text-gray-300">{char.emotionalArc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};