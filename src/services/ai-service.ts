import { supabase } from "@/integrations/supabase/client";
import { deductAICredits } from "@/hooks/useAICredits";

// Types for AI requests and responses
export interface AIRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  feature: 'dialogue' | 'scene' | 'cultural' | 'revision' | 'plot' | 'character' | 'development';
  genre?: string;
  language?: string;
  region?: string;
  promptType?: 'plot' | 'character' | 'dialogue';
  subGenres?: string[];
  culturalAuthenticity?: number;
  includeTraditional?: boolean;
  setting?: {
    region?: string;
    era?: string;
  };
  seedPlot?: string;
  batchNumber?: number;
  synopsis?: string;
  sceneDescription?: string;
  tone?: string;
  customSystemPrompt?: string;
  promptOverride?: string;
  isAnalysis?: boolean;
  skipCreditDeduction?: boolean;
  creditCost?: number;
}

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
  errorType?: 'credits' | 'auth' | 'service' | 'network' | 'unknown';
  credits?: number;
  title?: string;
  usage?: any;
  fallbackUsed?: boolean;
}

// Unified function to generate AI content
export const generateAIContent = async (request: AIRequest): Promise<AIResponse> => {
  try {
    console.log(`Requesting AI content for ${request.feature}`, request);

    if (!request.skipCreditDeduction) {
      // Default to 3 for analysis, 1 for small requests, or use explicit cost
      const defaultCost = request.isAnalysis ? 3 : 1;
      const cost = request.creditCost || defaultCost;

      const creditResult = await deductAICredits(cost, request.feature, `AI Action: ${request.feature}`);
      if (!creditResult.success) {
        return {
          content: '',
          success: false,
          error: creditResult.message || `Insufficient AI credits. You need ${cost} credits.`,
          errorType: 'credits'
        };
      }
    }

    // Determine which edge function to use based on the request
    // Use generate-script-content for all content generation
    const functionName = 'generate-script-content';

    // Prepare the request body - using generate-script-content for all requests
    const requestBody = {
      prompt: request.prompt,
      context: request.context || '',
      maxTokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      feature: request.feature,
      batchNumber: request.batchNumber || 0,
      // Include plot-style parameters for compatibility
      promptType: request.promptType,
      genre: request.genre,
      subGenres: request.subGenres,
      language: request.language,
      seedPlot: request.seedPlot,
      culturalAuthenticity: request.culturalAuthenticity,
      includeTraditional: request.includeTraditional,
      setting: request.setting,
      synopsis: request.synopsis,
      sceneDescription: request.sceneDescription,
      tone: request.tone,
      customSystemPrompt: request.customSystemPrompt,
      promptOverride: request.promptOverride,
      isAnalysis: request.isAnalysis
    };

    console.log(`Invoking ${functionName} with:`, requestBody);

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: requestBody,
      // @ts-ignore - keepalive is supported in modern browsers but may not be in all TS types
      headers: { 'keepalive': 'true' }
    });

    if (error) {
      console.error(`${functionName} error:`, error);
      throw new Error(error.message || `Failed to invoke ${functionName} function`);
    }

    console.log(`${functionName} response:`, data);

    if (!data) {
      throw new Error('No response from AI service');
    }

    return {
      content: data.content || '',
      success: data.success !== false,
      error: data.error,
      errorType: data.errorType,
      credits: data.credits,
      title: data.title,
      usage: data.usage,
      fallbackUsed: false
    };
  } catch (error) {
    console.error('AI content generation failed:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'unknown',
      fallbackUsed: true
    };
  }
};
