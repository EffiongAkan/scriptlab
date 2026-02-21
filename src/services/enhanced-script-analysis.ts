
import { generatePlotContent, PlotAIRequest } from "./plot-ai-service";
import { Genre, SubGenre, Language } from "@/types";

export interface ScriptAnalysisMetrics {
  overallScore: number;
  pacing: number;
  characterDevelopment: number;
  dialogueQuality: number;
  plotStructure: number;
  culturalAuthenticity: number;
  technicalFormatting: number;
}

export interface DetailedSuggestion {
  id: string;
  type: 'structure' | 'character' | 'dialogue' | 'pacing' | 'cultural' | 'formatting';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestion: string;
  elementId?: string;
  position?: number;
  aiGenerated?: boolean;
}

export interface ScriptAnalysisResult {
  metrics: ScriptAnalysisMetrics;
  suggestions: DetailedSuggestion[];
  characterAnalysis: CharacterAnalysis[];
  paceAnalysis: PaceAnalysis;
  culturalNotes: string[];
  strengthsIdentified: string[];
}

export interface CharacterAnalysis {
  name: string;
  appearances: number;
  developmentScore: number;
  consistencyScore: number;
  suggestions: string[];
}

export interface PaceAnalysis {
  averageSceneLength: number;
  dialogueToActionRatio: number;
  sceneTransitionQuality: number;
  overallPacing: 'slow' | 'moderate' | 'fast' | 'inconsistent';
  suggestions: string[];
}

export class EnhancedScriptAnalyzer {
  static async analyzeScript(
    elements: any[],
    genre?: Genre,
    language?: Language,
    synopsis?: string,
    industry?: string
  ): Promise<ScriptAnalysisResult> {
    if (!elements || elements.length === 0) {
      throw new Error("No script elements to analyze");
    }

    // Generate AI-powered analysis
    const aiAnalysis = await this.generateAIAnalysis(elements, genre, language, synopsis, industry);

    // Combine with structural analysis
    const structuralAnalysis = this.performStructuralAnalysis(elements);

    return {
      metrics: this.calculateMetrics(elements, aiAnalysis, structuralAnalysis),
      suggestions: await this.generateSuggestions(elements, aiAnalysis, genre, language),
      characterAnalysis: this.analyzeCharacters(elements),
      paceAnalysis: this.analyzePacing(elements),
      culturalNotes: this.extractCulturalNotes(aiAnalysis),
      strengthsIdentified: this.identifyStrengths(elements, aiAnalysis)
    };
  }

  private static async generateAIAnalysis(
    elements: any[],
    genre?: Genre,
    language?: Language,
    synopsis?: string,
    industry?: string
  ): Promise<string> {
    const scriptText = elements.map(el => `${el.type.toUpperCase()}: ${el.content}`).join('\n');

    const cleanSynopsis = (synopsis === 'null' || synopsis === 'undefined' || !synopsis) ? 'Not provided' : synopsis;
    const cleanIndustry = (industry === 'null' || industry === 'undefined' || !industry) ? 'Not specified' : industry;

    const analysisPrompt = `Analyze this ${genre || 'screenplay'} script for:
1. Plot structure and pacing
2. Character development and consistency
3. Dialogue quality and authenticity
4. Cultural authenticity (Nigerian context)
5. Technical formatting
6. Strengths and areas for improvement

SYNOPSIS: ${cleanSynopsis}
INDUSTRY: ${cleanIndustry}

Script:
${scriptText.substring(0, 3000)}${scriptText.length > 3000 ? '...' : ''}

Provide detailed analysis with specific suggestions for improvement.`;

    const request: PlotAIRequest = {
      promptType: 'plot',
      genre: genre,
      language: language || Language.ENGLISH,
      seedPlot: analysisPrompt,
      culturalAuthenticity: 90,
      includeTraditional: true,
      synopsis: cleanSynopsis,
      tone: cleanIndustry,
      sceneDescription: 'Full script structural analysis',
      customSystemPrompt: "You are an elite Hollywood script consultant and story analyst. Provide a comprehensive structural and narrative analysis of the provided script content."
    };

    const response = await generatePlotContent(request);

    if (!response.success) {
      console.warn("AI Analysis failed:", response.error);
      throw new Error(response.error || "AI Analysis failed to generate content");
    }

    return response.content;
  }

  private static performStructuralAnalysis(elements: any[]) {
    const headings = elements.filter(el => el.type === 'heading');
    const dialogue = elements.filter(el => el.type === 'dialogue');
    const action = elements.filter(el => el.type === 'action');
    const characters = elements.filter(el => el.type === 'character');

    return {
      sceneCount: headings.length,
      dialogueCount: dialogue.length,
      actionCount: action.length,
      characterCount: new Set(characters.map(el => el.content)).size,
      averageSceneLength: elements.length / Math.max(headings.length, 1),
      dialogueToActionRatio: dialogue.length / Math.max(action.length, 1)
    };
  }

  private static calculateMetrics(
    elements: any[],
    aiAnalysis: string,
    structural: any
  ): ScriptAnalysisMetrics {
    // Basic structural scoring
    const pacingScore = Math.min(100, Math.max(0,
      (structural.dialogueToActionRatio > 0.5 && structural.dialogueToActionRatio < 2) ? 85 : 60
    ));

    const structureScore = Math.min(100,
      structural.sceneCount > 0 ? Math.min(85, structural.sceneCount * 10) : 30
    );

    const characterScore = Math.min(100, structural.characterCount * 15);

    // AI analysis scoring (extract from AI response)
    const culturalScore = this.extractScoreFromAI(aiAnalysis, 'cultural') || 75;
    const dialogueScore = this.extractScoreFromAI(aiAnalysis, 'dialogue') || 70;
    const formattingScore = 85; // Base score for proper element types

    const overallScore = Math.round(
      (pacingScore + structureScore + characterScore + culturalScore + dialogueScore + formattingScore) / 6
    );

    return {
      overallScore,
      pacing: pacingScore,
      characterDevelopment: characterScore,
      dialogueQuality: dialogueScore,
      plotStructure: structureScore,
      culturalAuthenticity: culturalScore,
      technicalFormatting: formattingScore
    };
  }

  private static async generateSuggestions(
    elements: any[],
    aiAnalysis: string,
    genre?: Genre,
    language?: Language
  ): Promise<DetailedSuggestion[]> {
    const suggestions: DetailedSuggestion[] = [];

    // Generate AI-powered suggestions
    const enhancementPrompt = `Based on this script analysis, provide 5-7 specific, actionable suggestions for improvement:

${aiAnalysis.substring(0, 1500)}

Format each suggestion as:
TYPE: [structure/character/dialogue/pacing/cultural/formatting]
SEVERITY: [low/medium/high]
TITLE: Brief title
DESCRIPTION: What the issue is
SUGGESTION: Specific actionable advice`;

    const request: PlotAIRequest = {
      promptType: 'plot',
      genre: genre,
      language: language || Language.ENGLISH,
      seedPlot: enhancementPrompt,
      culturalAuthenticity: 90,
      includeTraditional: true
    };

    const response = await generatePlotContent(request);

    if (response.success) {
      const parsedSuggestions = this.parseSuggestionsFromAI(response.content);
      suggestions.push(...parsedSuggestions);
    }

    // Add structural suggestions
    const structural = this.performStructuralAnalysis(elements);

    if (structural.sceneCount < 3) {
      suggestions.push({
        id: `structural-scenes-${Date.now()}`,
        type: 'structure',
        severity: 'high',
        title: 'Add More Scenes',
        description: 'Your script has very few scenes',
        suggestion: 'Consider breaking your story into more distinct scenes to improve pacing and structure.',
        aiGenerated: false
      });
    }

    if (structural.characterCount < 2) {
      suggestions.push({
        id: `character-count-${Date.now()}`,
        type: 'character',
        severity: 'medium',
        title: 'Develop More Characters',
        description: 'Limited character diversity detected',
        suggestion: 'Consider adding supporting characters to enrich your story and create more dynamic interactions.',
        aiGenerated: false
      });
    }

    return suggestions;
  }

  private static analyzeCharacters(elements: any[]): CharacterAnalysis[] {
    const characters = elements.filter(el => el.type === 'character');
    const characterMap = new Map<string, number>();

    characters.forEach(char => {
      const name = char.content;
      characterMap.set(name, (characterMap.get(name) || 0) + 1);
    });

    return Array.from(characterMap.entries()).map(([name, appearances]) => ({
      name,
      appearances,
      developmentScore: Math.min(100, appearances * 10 + Math.random() * 20),
      consistencyScore: Math.min(100, 80 + Math.random() * 20),
      suggestions: [
        `Consider developing ${name}'s background further`,
        `Add more distinctive dialogue patterns for ${name}`,
        `Explore ${name}'s relationship with other characters`
      ]
    }));
  }

  private static analyzePacing(elements: any[]): PaceAnalysis {
    const structural = this.performStructuralAnalysis(elements);

    let overallPacing: 'slow' | 'moderate' | 'fast' | 'inconsistent' = 'moderate';

    if (structural.averageSceneLength > 20) {
      overallPacing = 'slow';
    } else if (structural.averageSceneLength < 5) {
      overallPacing = 'fast';
    } else if (structural.dialogueToActionRatio > 3 || structural.dialogueToActionRatio < 0.3) {
      overallPacing = 'inconsistent';
    }

    return {
      averageSceneLength: structural.averageSceneLength,
      dialogueToActionRatio: structural.dialogueToActionRatio,
      sceneTransitionQuality: 75 + Math.random() * 20,
      overallPacing,
      suggestions: [
        overallPacing === 'slow' ? 'Consider shortening scenes or adding more dynamic action' : '',
        overallPacing === 'fast' ? 'Allow more time for character development and scene building' : '',
        structural.dialogueToActionRatio > 2 ? 'Balance dialogue with more visual storytelling' : '',
        structural.dialogueToActionRatio < 0.5 ? 'Add more character interaction and dialogue' : ''
      ].filter(Boolean)
    };
  }

  private static extractCulturalNotes(aiAnalysis: string): string[] {
    const lines = aiAnalysis.split('\n');
    const culturalNotes: string[] = [];

    lines.forEach(line => {
      if (line.toLowerCase().includes('cultural') ||
        line.toLowerCase().includes('nigerian') ||
        line.toLowerCase().includes('authentic')) {
        culturalNotes.push(line.trim());
      }
    });

    return culturalNotes.slice(0, 5);
  }

  private static identifyStrengths(elements: any[], aiAnalysis: string): string[] {
    const strengths: string[] = [];

    if (elements.filter(el => el.type === 'dialogue').length > 5) {
      strengths.push('Rich dialogue content');
    }

    if (elements.filter(el => el.type === 'heading').length > 2) {
      strengths.push('Well-structured scene progression');
    }

    if (new Set(elements.filter(el => el.type === 'character').map(el => el.content)).size > 2) {
      strengths.push('Diverse character cast');
    }

    // Extract strengths from AI analysis
    const lines = aiAnalysis.split('\n');
    lines.forEach(line => {
      if (line.toLowerCase().includes('strength') ||
        line.toLowerCase().includes('good') ||
        line.toLowerCase().includes('well')) {
        strengths.push(line.trim());
      }
    });

    return strengths.slice(0, 6);
  }

  private static extractScoreFromAI(text: string, category: string): number | null {
    const regex = new RegExp(`${category}[:\\s]*([0-9]+)`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1], 10) : null;
  }

  private static parseSuggestionsFromAI(text: string): DetailedSuggestion[] {
    const suggestions: DetailedSuggestion[] = [];
    const sections = text.split(/TYPE:/i).slice(1);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const typeMatch = lines[0]?.match(/\[(.*?)\]/);
      const severityMatch = lines.find(l => l.includes('SEVERITY:'))?.match(/\[(.*?)\]/);
      const titleMatch = lines.find(l => l.includes('TITLE:'))?.replace(/TITLE:/i, '').trim();
      const descMatch = lines.find(l => l.includes('DESCRIPTION:'))?.replace(/DESCRIPTION:/i, '').trim();
      const suggMatch = lines.find(l => l.includes('SUGGESTION:'))?.replace(/SUGGESTION:/i, '').trim();

      if (typeMatch && titleMatch && suggMatch) {
        suggestions.push({
          id: `ai-suggestion-${Date.now()}-${index}`,
          type: typeMatch[1] as any,
          severity: (severityMatch?.[1] || 'medium') as any,
          title: titleMatch,
          description: descMatch || '',
          suggestion: suggMatch,
          aiGenerated: true
        });
      }
    });

    return suggestions;
  }
}
