
import { generateAIContent, AIRequest, AIResponse } from './ai-service';

// Re-export the unified service functions with the old interface for compatibility
export { generateAIContent };
export const generateAIContentEnhanced = generateAIContent;

export const validateAIConfiguration = async (): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const testRequest: AIRequest = {
      prompt: "Test connection",
      feature: 'dialogue',
      maxTokens: 10
    };
    
    const response = await generateAIContent(testRequest);
    
    if (response.fallbackUsed) {
      return {
        isValid: false,
        error: 'AI service is not properly configured or unavailable'
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
};

export const getAIServiceStatus = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unavailable';
  message: string;
}> => {
  try {
    const validation = await validateAIConfiguration();
    
    if (validation.isValid) {
      return {
        status: 'healthy',
        message: 'AI service is operating normally'
      };
    } else {
      return {
        status: 'degraded',
        message: validation.error || 'AI service has issues'
      };
    }
  } catch (error) {
    return {
      status: 'unavailable',
      message: 'AI service is currently unavailable'
    };
  }
};

// Export types for compatibility
export type { AIRequest, AIResponse };
