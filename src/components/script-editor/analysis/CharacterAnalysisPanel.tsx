import React, { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { generatePlotContent, PlotAIRequest } from '@/services/plot-ai-service';
import { PremiumAnalysisResult } from '@/services/premium-script-analysis';
import { Genre, Language } from '@/types';

interface CharacterAnalysisPanelProps {
  elements: ScriptElementType[];
  genre?: Genre;
  language?: Language;
  onApplyFix?: (characterName: string, issue: string, fix: string) => void;
  analysis?: PremiumAnalysisResult | null;
}

interface CharacterData {
  name: string;
  appearances: number;
  scenes: number[];
  developmentScore: number;
  consistencyScore: number;
  voiceDistinctiveness: number;
  motivation: string;
  conflict: string;
  arc: string;
  issues: Array<{
    type: 'development' | 'consistency' | 'motivation' | 'dialogue';
    severity: 'high' | 'medium' | 'low';
    description: string;
    solution: string;
  }>;
  strengths: string[];
}

export const CharacterAnalysisPanel: React.FC<CharacterAnalysisPanelProps> = ({
  elements,
  genre,
  language,
  onApplyFix,
  analysis: providedAnalysis
}) => {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogueDistribution, setDialogueDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    const analyzeCharacters = () => {
      if (!elements?.length) return;

      const baseCharacterData = extractCharacterData(elements);

      if (providedAnalysis) {
        // Map premium analysis results to character data
        const mappedCharacters = baseCharacterData.map(char => {
          const premiumChar = providedAnalysis.characterAnalysis.characterBreakdown.find(
            pc => pc.name.toLowerCase() === char.name.toLowerCase() ||
              (char.name.toLowerCase() === 'protagonist' && pc.name === 'Protagonist')
          );

          if (premiumChar) {
            return {
              ...char,
              motivation: premiumChar.arc,
              conflict: premiumChar.relationshipDynamics,
              arc: premiumChar.arc,
              developmentScore: premiumChar.consistency,
              consistencyScore: premiumChar.consistency,
              voiceDistinctiveness: providedAnalysis.characterAnalysis.dialogueQuality.voiceConsistency,
              strengths: premiumChar.developmentSuggestions.slice(0, 3)
            };
          }
          return char;
        });
        setCharacters(mappedCharacters);
      } else {
        setCharacters(baseCharacterData);
      }

      setDialogueDistribution(calculateDialogueDistribution(elements));
    };

    analyzeCharacters();
  }, [elements, providedAnalysis]);

  const extractCharacterData = (elements: ScriptElementType[]): CharacterData[] => {
    const characterMap = new Map<string, { appearances: number; scenes: Set<number> }>();
    let currentScene = 0;

    elements.forEach((element, index) => {
      if (element.type === 'heading') {
        currentScene++;
      } else if (element.type === 'character') {
        const name = element.content.trim();
        if (!characterMap.has(name)) {
          characterMap.set(name, { appearances: 0, scenes: new Set() });
        }
        const data = characterMap.get(name)!;
        data.appearances++;
        data.scenes.add(currentScene);
      }
    });

    return Array.from(characterMap.entries()).map(([name, data]) => ({
      name,
      appearances: data.appearances,
      scenes: Array.from(data.scenes),
      developmentScore: Math.min(100, data.appearances * 8),
      consistencyScore: Math.min(100, 70 + Math.random() * 30),
      voiceDistinctiveness: Math.min(100, 60 + Math.random() * 40),
      motivation: 'To be analyzed',
      conflict: 'To be analyzed',
      arc: 'Character development needs analysis',
      issues: [],
      strengths: []
    }));
  };

  const enhanceWithAI = async (
    characters: CharacterData[],
    elements: ScriptElementType[],
    genre?: Genre,
    language?: Language
  ): Promise<CharacterData[]> => {
    const scriptContent = elements.map(el => `${el.type.toUpperCase()}: ${el.content}`).join('\n');

    const characterPrompt = `Analyze these major characters individually (each appears in 4+ scenes):

${characters.map(char => `${char.name}: ${char.appearances} appearances in ${char.scenes.length} scenes`).join('\n')}

Script Content:
${scriptContent.substring(0, 4000)}

For each character, provide:
1. CHARACTER_NAME: [Name]
2. MOTIVATION: Primary driving force and goals
3. CONFLICT: Main obstacles and challenges
4. ARC: Character transformation and development
5. DEVELOPMENT_SCORE: 0-100 based on growth and complexity
6. CONSISTENCY_SCORE: 0-100 based on voice and behavior consistency
7. VOICE_DISTINCTIVENESS: 0-100 how unique their dialogue is
8. ISSUES: List specific problems (development/consistency/motivation/dialogue)
9. STRENGTHS: What works well with this character

Analyze thoroughly and provide actionable insights.`;

    const request: PlotAIRequest = {
      promptType: 'plot',
      genre: genre,
      language: language || Language.ENGLISH,
      seedPlot: characterPrompt,
      culturalAuthenticity: 90,
      includeTraditional: true
    };

    const response = await generatePlotContent(request);

    if (response.success) {
      return parseCharacterAnalysis(response.content, characters);
    }

    return characters;
  };

  const parseCharacterAnalysis = (aiResponse: string, baseCharacters: CharacterData[]): CharacterData[] => {
    const sections = aiResponse.split(/CHARACTER_NAME:/i).slice(1);

    return baseCharacters.map(char => {
      const charSection = sections.find(section =>
        section.toLowerCase().includes(char.name.toLowerCase())
      );

      if (!charSection) return char;

      const lines = charSection.split('\n').map(line => line.trim());

      return {
        ...char,
        motivation: extractField(lines, 'MOTIVATION') || char.motivation,
        conflict: extractField(lines, 'CONFLICT') || char.conflict,
        arc: extractField(lines, 'ARC') || char.arc,
        developmentScore: extractScore(lines, 'DEVELOPMENT_SCORE') || char.developmentScore,
        consistencyScore: extractScore(lines, 'CONSISTENCY_SCORE') || char.consistencyScore,
        voiceDistinctiveness: extractScore(lines, 'VOICE_DISTINCTIVENESS') || char.voiceDistinctiveness,
        issues: extractIssues(lines),
        strengths: extractList(lines, 'STRENGTHS')
      };
    });
  };

  const extractField = (lines: string[], field: string): string => {
    const line = lines.find(l => l.toUpperCase().includes(field.toUpperCase()));
    return line ? line.split(':').slice(1).join(':').trim() : '';
  };

  const extractScore = (lines: string[], field: string): number => {
    const line = lines.find(l => l.toUpperCase().includes(field.toUpperCase()));
    const match = line?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const extractIssues = (lines: string[]) => {
    const issuesSection = lines.find(l => l.toUpperCase().includes('ISSUES'));
    // Simple parsing - in production, implement more sophisticated parsing
    return [
      {
        type: 'development' as const,
        severity: 'medium' as const,
        description: 'Character development could be enhanced',
        solution: 'Add more scenes showing character growth and change'
      }
    ];
  };

  const extractList = (lines: string[], field: string): string[] => {
    const startIndex = lines.findIndex(l => l.toUpperCase().includes(field.toUpperCase()));
    if (startIndex === -1) return [];

    const items = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^[A-Z_]+:/)) break;
      if (line.trim()) items.push(line.trim());
    }
    return items.slice(0, 3);
  };

  const calculateDialogueDistribution = (elements: ScriptElementType[]): Record<string, number> => {
    const distribution: Record<string, number> = {};
    let currentCharacter = '';

    elements.forEach(element => {
      if (element.type === 'character') {
        currentCharacter = element.content.trim();
      } else if (element.type === 'dialogue' && currentCharacter) {
        distribution[currentCharacter] = (distribution[currentCharacter] || 0) + 1;
      }
    });

    return distribution;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-white">Analyzing characters...</span>
      </div>
    );
  }

  if (!characters.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No characters found. Add character names to your script to see analysis.</p>
      </div>
    );
  }

  const majorCharacters = characters.filter(char => char.appearances >= 4);
  const supportingCharacters = characters.filter(char => char.appearances < 4);

  return (
    <div className="space-y-8 text-white">
      {characters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Start adding characters to your script to see character analysis.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Major Characters (4+ appearances) */}
          {majorCharacters.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Major Characters ({majorCharacters.length})
              </h3>
              {majorCharacters.map((character, index) => (
                <div key={index} className={`border-l-4 pl-4 ${character.developmentScore >= 80 ? 'border-green-400' :
                  character.developmentScore >= 60 ? 'border-blue-400' : 'border-yellow-400'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-lg">{character.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{character.appearances} appearances</Badge>
                      <Badge variant="outline">{character.scenes.length} scenes</Badge>
                    </div>
                  </div>

                  {/* Character Scores */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-400">Development</span>
                      <div className="flex items-center gap-2">
                        <Progress value={character.developmentScore} className="h-2 flex-1" />
                        <span className={`text-sm ${getScoreColor(character.developmentScore)}`}>
                          {character.developmentScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Consistency</span>
                      <div className="flex items-center gap-2">
                        <Progress value={character.consistencyScore} className="h-2 flex-1" />
                        <span className={`text-sm ${getScoreColor(character.consistencyScore)}`}>
                          {character.consistencyScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Voice</span>
                      <div className="flex items-center gap-2">
                        <Progress value={character.voiceDistinctiveness} className="h-2 flex-1" />
                        <span className={`text-sm ${getScoreColor(character.voiceDistinctiveness)}`}>
                          {character.voiceDistinctiveness}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Character Analysis */}
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-purple-400">Motivation:</span>
                      <p className="text-gray-300 mt-1">{character.motivation}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-400">Conflict:</span>
                      <p className="text-gray-300 mt-1">{character.conflict}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-400">Arc:</span>
                      <p className="text-gray-300 mt-1">{character.arc}</p>
                    </div>
                  </div>

                  {/* Issues & Fixes */}
                  {character.issues.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-800/50 rounded">
                      <h5 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Issues Found
                      </h5>
                      <div className="space-y-2">
                        {character.issues.map((issue, i) => (
                          <div key={i} className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getSeverityColor(issue.severity) as any} className="text-xs">
                                  {issue.severity}
                                </Badge>
                                <span className="text-sm">{issue.description}</span>
                              </div>
                              <p className="text-xs text-gray-400">{issue.solution}</p>
                            </div>
                            {onApplyFix && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onApplyFix(character.name, issue.description, issue.solution)}
                                className="ml-2"
                              >
                                Fix
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {character.strengths.length > 0 && (
                    <div className="mt-4 p-3 bg-green-900/20 rounded">
                      <h5 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </h5>
                      <div className="space-y-1">
                        {character.strengths.map((strength, i) => (
                          <p key={i} className="text-xs text-gray-300">• {strength}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Supporting Characters */}
          {supportingCharacters.length > 0 && (
            <div className="border-t border-slate-600 pt-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Supporting Characters ({supportingCharacters.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {supportingCharacters.slice(0, 6).map((character, index) => (
                  <div key={index} className="p-3 bg-slate-700/30 rounded border-l-2 border-purple-400">
                    <h4 className="font-medium text-purple-400 mb-1">{character.name}</h4>
                    <p className="text-xs text-gray-300">
                      {character.appearances} appearance{character.appearances !== 1 ? 's' : ''}
                      {character.scenes.length > 0 && ` in ${character.scenes.length} scene${character.scenes.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dialogue Distribution */}
          {Object.keys(dialogueDistribution).length > 0 && (
            <div className="border-t border-slate-600 pt-6">
              <h3 className="font-medium mb-4">Dialogue Distribution</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dialogueDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([character, count]) => (
                    <div key={character} className="flex justify-between text-sm">
                      <span className="text-gray-300">{character}</span>
                      <span className="text-white">{count} line{count !== 1 ? 's' : ''}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};