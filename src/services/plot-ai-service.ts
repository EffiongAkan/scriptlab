
import { generateAIContent, AIRequest, AIResponse } from './ai-service';
import { Genre, SubGenre, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface PlotAIRequest {
  promptType: 'plot' | 'character' | 'dialogue';
  genre: Genre;
  subGenres?: SubGenre[];
  language?: Language;
  setting?: {
    region?: string;
    era?: string;
  };
  seedPlot?: string;
  culturalAuthenticity?: number;
  includeTraditional?: boolean;
  synopsis?: string;
  tone?: string;
  sceneDescription?: string;
  customSystemPrompt?: string;
}

export interface PlotAIResponse {
  content: string;
  success: boolean;
  error?: string;
  errorType?: 'credits' | 'auth' | 'service' | 'network' | 'unknown';
  credits?: number;
  title?: string;
}

export const checkUserCredits = async (): Promise<{ credits: number; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { credits: 0, error: 'User not authenticated' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user credits:', error);
      return { credits: 0, error: 'Failed to fetch credits' };
    }

    return { credits: profile?.ai_credits || 0 };
  } catch (error) {
    console.error('Error in checkUserCredits:', error);
    return { credits: 0, error: 'Unexpected error occurred' };
  }
};

export const generatePlotContent = async (request: PlotAIRequest): Promise<PlotAIResponse> => {
  try {
    console.log('Plot AI service request:', request);

    // Map to unified AI request
    const aiRequest: AIRequest = {
      prompt: request.seedPlot || `Create a ${request.promptType} for a ${request.genre} story`,
      feature: 'plot',
      promptType: request.promptType,
      genre: request.genre,
      subGenres: request.subGenres,
      language: request.language || Language.ENGLISH,
      setting: request.setting,
      seedPlot: request.seedPlot,
      culturalAuthenticity: request.culturalAuthenticity,
      includeTraditional: request.includeTraditional,
      synopsis: request.synopsis,
      tone: request.tone,
      sceneDescription: request.sceneDescription || 'Script content generation',
      customSystemPrompt: request.customSystemPrompt,
      maxTokens: request.promptType === 'plot' ? 1500 : 1000,
      temperature: 0.7
    };

    const response = await generateAIContent(aiRequest);

    // Generate title based on request
    let title = `${request.genre} ${request.promptType.charAt(0).toUpperCase() + request.promptType.slice(1)}`;
    if (request.subGenres && request.subGenres.length > 0) {
      title += ` - ${request.subGenres[0]}`;
    }

    return {
      content: response.content,
      success: response.success,
      error: response.error,
      errorType: response.errorType,
      credits: response.credits,
      title: response.title || title
    };

  } catch (error: any) {
    console.error('Plot AI service error:', error);

    return {
      content: "",
      success: false,
      error: error.message || "Failed to generate content",
      errorType: "unknown"
    };
  }
};
