
// Add RegionType at the top for correct typing
type RegionType = "lagos" | "abuja" | "kano" | "port-harcourt";

/**
 * Deepseek AI Service for real-time content generation
 * Replace 'YOUR_DEEPSEEK_API_KEY' with actual API key or use env/Supabase secret feature for production
 */
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/generate";
const DEEPSEEK_API_KEY = ""; // Store securely with supabase secrets or .env

type DeepseekFeature = 'suggestion' | 'character' | 'dialogue' | 'scene' | 'cultural';

export interface DeepseekAIRequest {
  prompt: string;
  context?: string;
  feature: DeepseekFeature;
  maxTokens?: number;
  temperature?: number;
  region?: RegionType;
}

export interface DeepseekAIResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Main generic Deepseek function - exported for advanced or fallback use.
 */
export const generateDeepseekContent = async (
  request: DeepseekAIRequest
): Promise<DeepseekAIResponse> => {
  try {
    if (!DEEPSEEK_API_KEY) {
      return {
        content: "",
        success: false,
        error: "Deepseek API key not configured"
      };
    }

    // Add explicit regional cultural context to all prompts
    const region = request.region || "lagos";
    const regionMap: Record<RegionType, string> = {
      lagos: "Lagos / Yoruba / Urban Nigerian context",
      abuja: "Abuja / Hausa / Central Nigerian context",
      kano: "Kano / Hausa / Northern Nigerian context",
      "port-harcourt": "Port Harcourt / Ijaw / Niger Delta context",
    };

    const fullPrompt = `[${request.feature.toUpperCase()}] Nigerian context: (${regionMap[region]}) — ${request.prompt}${
      request.context ? "\nContext: " + request.context : ""
    }`;

    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        max_tokens: request.maxTokens || 300,
        temperature: request.temperature ?? 0.7
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        content: "",
        success: false,
        error: result.error?.message || "Failed to generate with Deepseek AI",
      };
    }

    // API returns { content: <string> } or similar
    return {
      content: result.content || "",
      success: true,
    };
  } catch (e: any) {
    return {
      content: "",
      success: false,
      error: e.message || "Unknown error from Deepseek AI"
    };
  }
};


// ======= SPECIALIZED AI SERVICE FUNCTIONS =======

/**
 * Generate a dialogue completion suggestion for a script, ensuring Nigerian context.
 */
export async function generateDialogueCompletion(options: {
  prompt: string,
  context?: string,
  maxTokens?: number,
  temperature?: number,
  region?: RegionType
}): Promise<DeepseekAIResponse> {
  return await generateDeepseekContent({
    prompt: `As a Nigerian screenwriter, continue or enhance this dialogue, maintaining natural, authentic tone: \n${options.prompt}\n[Ensure strong ${options.region ?? 'Nigerian'} cultural context and vernacular]`,
    context: options.context,
    feature: "dialogue",
    maxTokens: options.maxTokens ?? 180,
    temperature: options.temperature ?? 0.6,
    region: options.region
  });
}

/**
 * Generate a culturally authentic character suggestion.
 */
export async function generateCharacterSuggestion(options: {
  prompt: string,
  context?: string,
  maxTokens?: number,
  temperature?: number,
  region?: RegionType
}): Promise<DeepseekAIResponse> {
  return await generateDeepseekContent({
    prompt: `Help create or deepen this character for a Nollywood screenplay. Ensure traits, goals, and background reflect real Nigerian (${options.region ?? 'lagos'}) experience.\n${options.prompt}\nBe vivid, detailed, and authentic in that regional context.`,
    context: options.context,
    feature: "character",
    maxTokens: options.maxTokens ?? 220,
    temperature: options.temperature ?? 0.7,
    region: options.region
  });
}

/**
 * Analyze a screenplay scene with explicit cultural lens.
 */
export async function generateSceneAnalysis(options: {
  prompt: string,
  context?: string,
  maxTokens?: number,
  temperature?: number,
  region?: RegionType
}): Promise<DeepseekAIResponse> {
  return await generateDeepseekContent({
    prompt: `Analyze this screenplay scene for pacing, tension, authenticity, and ${options.region ?? 'lagos'} Nigerian cultural cues. Focus on references and storytelling patterns from that region.\n${options.prompt}`,
    context: options.context,
    feature: "scene",
    maxTokens: options.maxTokens ?? 350,
    temperature: options.temperature ?? 0.7,
    region: options.region
  });
}

/**
 * Provide specific AI suggestions for cultural authenticity or context.
 */
export async function generateCulturalSuggestion(options: {
  prompt: string,
  context?: string,
  maxTokens?: number,
  temperature?: number,
  region?: RegionType
}): Promise<DeepseekAIResponse> {
  return await generateDeepseekContent({
    prompt: `Consult as a Nigerian cultural expert (${options.region ?? 'lagos'} region): ${options.prompt}\nEnsure feedback is deeply rooted in that region's culture, language, and perspectives.`,
    context: options.context,
    feature: "cultural",
    maxTokens: options.maxTokens ?? 200,
    temperature: options.temperature ?? 0.65,
    region: options.region
  });
}
