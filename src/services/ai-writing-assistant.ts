import { generateAIContent } from './ai-service';

export interface WritingSuggestion {
  id: string;
  type: 'dialogue' | 'character' | 'plot' | 'formatting' | 'pacing';
  severity: 'info' | 'suggestion' | 'warning';
  message: string;
  position: number;
  originalText?: string;
  suggestedText?: string;
}

export interface ScriptQualityMetrics {
  overallScore: number;
  characterDevelopment: number;
  plotStructure: number;
  dialogue: number;
  pacing: number;
  formatting: number;
  suggestions: WritingSuggestion[];
}

export interface CharacterArc {
  name: string;
  development: number;
  consistency: number;
  motivation: string;
}

export interface PlotStructure {
  act1: number;
  act2: number; 
  act3: number;
  climax: number;
  resolution: number;
}

export class AIWritingAssistant {
  static async generateContentSuggestion(
    elementType: string,
    context: string,
    previousElements: any[] = []
  ): Promise<string[]> {
    try {
      const prompt = `Provide 3 writing suggestions for improving this ${elementType} element: "${context}"`;
      
      const response = await generateAIContent({
        prompt,
        feature: 'revision',
        context: previousElements.map(el => el.content).slice(-3).join('\n'),
        maxTokens: 400,
        temperature: 0.7
      });

      if (response.success && response.content) {
        // Split response into individual suggestions
        const suggestions = response.content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, 3);
        
        return suggestions.length > 0 ? suggestions : [response.content];
      }

      // Fallback suggestions
      return [
        `Consider adding more specific details to enhance the ${elementType}.`,
        `Try incorporating more Nigerian cultural references for authenticity.`,
        `Think about how this ${elementType} advances the overall story.`
      ];

    } catch (error) {
      console.error('Error generating content suggestions:', error);
      return [
        `Review the pacing and flow of this ${elementType}.`,
        `Consider the character motivations in this scene.`,
        `Add more sensory details to make it more vivid.`
      ];
    }
  }

  static async analyzeScript(elements: any[]): Promise<ScriptQualityMetrics> {
    // Simulate analysis based on script elements
    const totalElements = elements.length;
    const dialogueElements = elements.filter(el => el.type === 'dialogue').length;
    const characterElements = elements.filter(el => el.type === 'character').length;
    const actionElements = elements.filter(el => el.type === 'action').length;

    // Calculate basic metrics
    const dialogueRatio = totalElements > 0 ? (dialogueElements / totalElements) * 100 : 0;
    const characterDiversity = new Set(elements.filter(el => el.type === 'character').map(el => el.content)).size;

    const metrics: ScriptQualityMetrics = {
      overallScore: Math.min(90, 60 + (characterDiversity * 5) + (dialogueRatio * 0.3)),
      characterDevelopment: Math.min(95, 50 + (characterDiversity * 8)),
      plotStructure: Math.min(90, 65 + (actionElements * 2)),
      dialogue: Math.min(95, 60 + (dialogueRatio * 0.5)),
      pacing: Math.min(85, 70 + (totalElements > 20 ? 15 : totalElements * 0.75)),
      formatting: Math.min(100, 80 + (totalElements > 10 ? 20 : totalElements * 2)),
      suggestions: []
    };

    // Generate suggestions based on analysis
    const suggestions: WritingSuggestion[] = [];

    if (metrics.characterDevelopment < 70) {
      suggestions.push({
        id: 'char-dev-1',
        type: 'character',
        severity: 'suggestion',
        message: 'Consider developing your characters further with more backstory and motivation.',
        position: 0
      });
    }

    if (metrics.dialogue < 75) {
      suggestions.push({
        id: 'dialogue-1',
        type: 'dialogue',
        severity: 'suggestion',
        message: 'Add more subtext and cultural authenticity to dialogue exchanges.',
        position: 0
      });
    }

    if (totalElements < 10) {
      suggestions.push({
        id: 'length-1',
        type: 'plot',
        severity: 'info',
        message: 'Consider expanding your script with more scenes and character development.',
        position: 0
      });
    }

    metrics.suggestions = suggestions;
    return metrics;
  }

  static async generateDialogue(
    character: string,
    situation: string,
    previousDialogue?: string
  ): Promise<string> {
    try {
      const prompt = `Generate authentic Nigerian dialogue for ${character} in this situation: ${situation}`;
      const context = previousDialogue ? `Previous dialogue: ${previousDialogue}` : undefined;

      const response = await generateAIContent({
        prompt,
        context,
        feature: 'dialogue',
        region: 'Lagos',
        maxTokens: 300,
        temperature: 0.7
      });

      return response.success ? response.content : `${character}\nI understand the situation, but we need to handle this carefully.`;

    } catch (error) {
      console.error('Error generating dialogue:', error);
      return `${character}\nThis is a complex matter that requires our attention.`;
    }
  }

  static async generateSceneDescription(
    location: string,
    mood: string,
    timeOfDay: string
  ): Promise<string> {
    try {
      const prompt = `Create a detailed scene description for: ${location} during ${timeOfDay} with a ${mood} mood. Make it authentically Nigerian.`;

      const response = await generateAIContent({
        prompt,
        feature: 'scene',
        region: 'Lagos',
        maxTokens: 400,
        temperature: 0.7
      });

      return response.success ? response.content : `${location.toUpperCase()} - ${timeOfDay.toUpperCase()}\n\nThe ${mood} atmosphere fills the space as the scene unfolds.`;

    } catch (error) {
      console.error('Error generating scene description:', error);
      return `${location.toUpperCase()} - ${timeOfDay.toUpperCase()}\n\nThe scene is set with careful attention to detail.`;
    }
  }
}
