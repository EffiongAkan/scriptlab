import { generateAIContent, AIRequest } from './ai-service';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { Genre, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export type AnalysisModuleType =
  | 'overview'
  | 'plot'
  | 'character'
  | 'pacing'
  | 'theme'
  | 'cultural'
  | 'technical'
  | 'industry'
  | 'recommendations';

export interface ModularAnalysisResult {
  module_type: AnalysisModuleType;
  content: any;
  created_at: string;
}

export class ModularScriptAnalyzer {
  /**
   * Performs a modular analysis pass for a specific category.
   * Requests JSON output from the AI for better structure.
   */
  static async analyzeModule(
    moduleType: AnalysisModuleType,
    elements: ScriptElementType[],
    context: {
      genre?: Genre;
      language?: Language;
      synopsis?: string;
      industry?: string;
      scriptId?: string;
    }
  ): Promise<any> {
    // Use smaller sample for plot and character analysis to avoid timeouts
    const sampleSize = (moduleType === 'plot' || moduleType === 'character') ? 200 : 300;
    const sampledContent = this.getSampledScriptContent(elements, sampleSize);
    const scriptContext = this.getScriptContext(elements, context);
    const prompt = this.getPromptForModule(moduleType, scriptContext, sampledContent);

    // Allocate tokens and timeout based on module type
    const maxTokens = (moduleType === 'plot' || moduleType === 'character') ? 2200 : 2000;
    const timeoutMs = (moduleType === 'plot' || moduleType === 'character') ? 70000 : 55000; // 70s for plot/character, 55s for others

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Analysis timed out for ${moduleType}`)), timeoutMs)
      );

      const analysisPromise = generateAIContent({
        prompt,
        feature: 'revision',
        isAnalysis: true,
        maxTokens,
        temperature: 0.2,
        synopsis: context.synopsis,
        tone: context.industry,
        customSystemPrompt: `You are a professional screenplay analyst with expertise in story structure.
CRITICAL: Your response must be ONLY a valid JSON object.
Do not include any text before or after the JSON.
Do not use markdown code blocks.
Provide detailed, specific insights.
Start with { and end with }.`
      });

      const response = await Promise.race([analysisPromise, timeoutPromise]) as any;

      if (!response.success || !response.content) {
        throw new Error(response.error || `Failed to generate ${moduleType} analysis`);
      }

      const parsedResult = this.extractAndParseJSON(response.content);

      // Save to database if scriptId and user exist
      if (context.scriptId) {
        await this.saveAnalysisToDb(context.scriptId, moduleType, parsedResult);
      }

      return parsedResult;
    } catch (error) {
      console.error(`[ModularAnalysis] Error analyzing ${moduleType}:`, error);
      throw error;
    }
  }

  private static extractAndParseJSON(content: string): any {
    const trimmed = content.trim();

    // Strategy 1: Look for markdown blocks
    let jsonStr = trimmed;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    // Strategy 2: Look for the outermost { and }
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = jsonStr.substring(start, end + 1);
    }

    // Final cleanup for common AI hallucinations/artifacts
    jsonStr = jsonStr
      .replace(/\\n/g, ' ')      // Replace literal \n with space
      .replace(/\n/g, ' ')      // Replace actual newlines with space
      .replace(/\s+/g, ' ')     // Collapse whitespace
      .trim();

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('[ModularAnalysis] JSON Parse Error. Content snippet:', jsonStr.substring(0, 500));
      // One last attempt: try to parse the raw trimmed content if it's very simple
      try {
        return JSON.parse(trimmed);
      } catch (e2) {
        throw new Error(`AI returned invalid JSON. Error: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }
  }

  private static async saveAnalysisToDb(scriptId: string, moduleType: AnalysisModuleType, content: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use upsert to update existing analysis for this script/module
      // Note: In a production app, we might want to keep history, 
      // but for now, we'll keep the latest for each module.
      const { error } = await supabase
        .from('script_analyses' as any)
        .upsert({
          script_id: scriptId,
          user_id: user.id,
          module_type: moduleType,
          content: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'script_id, module_type'
        });

      if (error) console.error('[ModularAnalysis] Error saving to DB:', error);
    } catch (e) {
      console.error('[ModularAnalysis] Auth error during save:', e);
    }
  }

  static async getStoredAnalysis(scriptId: string): Promise<Record<AnalysisModuleType, any> | null> {
    try {
      const { data, error } = await supabase
        .from('script_analyses' as any)
        .select('module_type, content')
        .eq('script_id', scriptId);

      if (error || !data || data.length === 0) return null;

      const result: any = {};
      data.forEach((row: any) => {
        result[row.module_type] = row.content;
      });
      return result as Record<AnalysisModuleType, any>;
    } catch (e) {
      return null;
    }
  }

  private static getPromptForModule(moduleType: AnalysisModuleType, context: string, script: string): string {
    const schemas: Record<AnalysisModuleType, string> = {
      overview: `{
        "executiveSummary": "string (3-4 sentences)",
        "overallScore": "number (0-100)",
        "marketViability": "string",
        "targetAudience": "string",
        "commercialPotential": "string"
      }`,
      plot: `{
        "structureAssessment": "detailed evaluation of overall structure (2-3 paragraphs)",
        "actBreakdown": [
          {
            "act": "number (1, 2, or 3)",
            "pageRange": "estimated range (e.g., '1-25')",
            "summary": "what happens in this act",
            "strengths": "what works well",
            "weaknesses": "what needs improvement"
          }
        ],
        "keyMoments": {
          "incitingIncident": "description and location",
          "midpoint": "description and location",
          "climax": "description and effectiveness analysis"
        },
        "plotHoles": [
          {
            "description": "specific plot hole",
            "severity": "critical|moderate|minor",
            "solution": "how to fix it"
          }
        ],
        "subplots": [
          {
            "description": "subplot summary",
            "integration": "rating 1-10",
            "suggestions": "improvement ideas"
          }
        ],
        "narrativeFlow": "comprehensive flow analysis (2-3 paragraphs)",
        "tensionAnalysis": "how tension builds throughout (1-2 paragraphs)"
      }`,
      character: `{
        "arcAnalysis": "string",
        "characterBreakdown": [
          {
            "name": "string",
            "arc": "string",
            "consistency": "number (0-100)",
            "voiceAnalysis": "string",
            "relationshipDynamics": "string",
            "developmentSuggestions": ["string"]
          }
        ],
        "dialogueQuality": {
          "analysis": "string",
          "strengths": ["string"],
          "improvements": ["string"],
          "voiceConsistency": "number (0-100)"
        }
      }`,
      pacing: `{
        "overallRhythm": "string",
        "sceneByScenePacing": "string",
        "tensionCurve": "string",
        "slowPoints": [
          {"location": "string", "issue": "string", "solution": "string"}
        ],
        "highlights": [
          {"location": "string", "description": "string", "whatWorks": "string"}
        ]
      }`,
      theme: `{
        "primaryThemes": ["string"],
        "themeExecution": "string",
        "thematicResonance": "string",
        "subtextAnalysis": "string",
        "symbolismUsage": "string"
      }`,
      cultural: `{
        "authenticityAssessment": "string",
        "culturalElements": [
          {"element": "string", "accuracy": "authentic|questionable|problematic", "feedback": "string"}
        ],
        "representationQuality": "string",
        "improvementSuggestions": ["string"]
      }`,
      technical: `{
        "formatting": "string",
        "sceneCraft": "string",
        "writingQuality": "string",
        "professionalReadiness": "string"
      }`,
      industry: `{
        "genreConventions": "string",
        "competitiveAnalysis": "string",
        "marketPositioning": "string",
        "festivalPotential": "string"
      }`,
      recommendations: `{
        "recommendations": [
          {
            "priority": "critical|high|medium|low",
            "category": "structure|character|dialogue|pacing|theme|cultural",
            "title": "string",
            "description": "string",
            "specificSteps": ["string"],
            "examples": "string"
          }
        ]
      }`
    };

    return `You are analyzing a screenplay. Your ONLY job is to return a JSON object with your analysis.

CRITICAL RULES:
1. Return ONLY valid JSON - no explanations, no markdown, no script quotes
2. Start your response with { and end with }
3. Follow this exact schema:

${schemas[moduleType]}

SCRIPT CONTEXT:
${context}

SCRIPT CONTENT TO ANALYZE:
${script}

Return your ${moduleType} analysis as JSON now:`;
  }

  // Reuse logic from PremiumScriptAnalyzer but cleaned up
  private static formatScriptForAnalysis(elements: ScriptElementType[]): string {
    return elements
      .map((el, i) => `${i + 1}. [${el.type.toUpperCase()}] ${el.content}`)
      .join('\n');
  }

  private static getSampledScriptContent(elements: ScriptElementType[], maxElements: number = 500): string {
    if (elements.length <= maxElements) {
      return this.formatScriptForAnalysis(elements);
    }
    const startCount = Math.floor(maxElements * 0.4);
    const endCount = Math.floor(maxElements * 0.3);
    const midCount = maxElements - startCount - endCount;
    const startElements = elements.slice(0, startCount);
    const endElements = elements.slice(-endCount);
    const midElementsRaw = elements.slice(startCount, -endCount);
    const midStep = Math.max(1, Math.floor(midElementsRaw.length / midCount));
    const midElements: ScriptElementType[] = [];
    for (let i = 0; i < midElementsRaw.length && midElements.length < midCount; i += midStep) {
      midElements.push(midElementsRaw[i]);
    }
    return [
      "--- SCRIPT START ---",
      this.formatScriptForAnalysis(startElements),
      "\n--- ... SAMPLED MIDDLE ... ---\n",
      this.formatScriptForAnalysis(midElements),
      "\n--- ... SCRIPT END ... ---\n",
      this.formatScriptForAnalysis(endElements)
    ].join('\n');
  }

  private static getScriptContext(elements: ScriptElementType[], context: any): string {
    const sceneCount = elements.filter(el => el.type === 'heading').length;
    const characterCount = new Set(elements.filter(el => el.type === 'character').map(el => el.content.trim())).size;
    const pageEstimate = Math.max(1, Math.ceil(elements.length / 50));

    return `Genre: ${context.genre || 'Not specified'}
Language: ${context.language || 'Not specified'}
Length: ${elements.length} elements (~${pageEstimate} pages)
Scenes: ${sceneCount}
Characters: ${characterCount}
Synopsis: ${context.synopsis || 'Not provided'}`;
  }
}
