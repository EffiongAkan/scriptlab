import { generateAIContent, AIRequest } from './ai-service';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { Genre, Language } from '@/types';

export interface PremiumAnalysisResult {
  overview: {
    executiveSummary: string;
    overallScore: number;
    marketViability: string;
    targetAudience: string;
    commercialPotential: string;
  };
  characterAnalysis: {
    arcAnalysis: string;
    characterBreakdown: Array<{
      name: string;
      arc: string;
      consistency: number;
      voiceAnalysis: string;
      relationshipDynamics: string;
      developmentSuggestions: string[];
    }>;
    dialogueQuality: {
      analysis: string;
      strengths: string[];
      improvements: string[];
      voiceConsistency: number;
    };
  };
  plotAnalysis: {
    structureBreakdown: string;
    threeActAnalysis: string;
    plotHoles: Array<{
      description: string;
      severity: 'critical' | 'moderate' | 'minor';
      location: string;
      solution: string;
    }>;
    narrativeFlow: string;
    subplotIntegration: string;
    climaxEffectiveness: string;
  };
  pacingAnalysis: {
    overallRhythm: string;
    sceneByScenePacing: string;
    tensionCurve: string;
    slowPoints: Array<{
      location: string;
      issue: string;
      solution: string;
    }>;
    highlights: Array<{
      location: string;
      description: string;
      whatWorks: string;
    }>;
  };
  themeAnalysis: {
    primaryThemes: string[];
    themeExecution: string;
    thematicResonance: string;
    subtextAnalysis: string;
    symbolismUsage: string;
  };
  culturalAnalysis: {
    authenticityAssessment: string;
    culturalElements: Array<{
      element: string;
      accuracy: 'authentic' | 'questionable' | 'problematic';
      feedback: string;
    }>;
    representationQuality: string;
    improvementSuggestions: string[];
  };
  industryComparison: {
    genreConventions: string;
    competitiveAnalysis: string;
    marketPositioning: string;
    festivalPotential: string;
  };
  actionableRecommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'structure' | 'character' | 'dialogue' | 'pacing' | 'theme' | 'cultural';
    title: string;
    description: string;
    specificSteps: string[];
    examples?: string;
  }>;
  technicalAssessment: {
    formatting: string;
    sceneCraft: string;
    writingQuality: string;
    professionalReadiness: string;
  };
}

export class PremiumScriptAnalyzer {
  private static async analyzeWithAI(
    promptInstructions: string,
    scriptContent: string,
    context: string = '',
    feature: 'dialogue' | 'scene' | 'cultural' | 'revision' | 'plot' | 'character' = 'revision',
    synopsis?: string,
    industry?: string
  ): Promise<string> {
    try {
      // PROMPT OPTIMIZATION: Move instructions to the TOP to avoid "lost in the middle"
      const request: AIRequest = {
        prompt: `TASK:
${promptInstructions}

CRITICAL FORMATTING INSTRUCTIONS:
1. You MUST use the exact XML tags requested (e.g., <TAG>Content</TAG>).
2. If XML tags fail, ensure the section name is a CLEAR HEADER (e.g., ### SECTION_NAME:).
3. Do not include any intro or outro text.
4. If a specific section is not applicable, write "N/A" inside the tag.

---

SCRIPT FOR ANALYSIS:
Script Context:
${context}

Script Content:
${scriptContent}

---

RE-STATED TASK:
${promptInstructions.substring(0, 100)}... (strict XML output required)`,
        context,
        maxTokens: 4000, // Increased to allow for more detailed analysis
        temperature: 0.3,
        feature,
        synopsis: (synopsis === 'null' || synopsis === 'undefined' || !synopsis) ? 'Not provided' : synopsis,
        tone: (industry === 'null' || industry === 'undefined' || !industry) ? 'Not specified' : industry,
        sceneDescription: 'Comprehensive script analysis',
        isAnalysis: true,
        customSystemPrompt: "You are an expert script analyst. You ALWAYS strictly follow the requested XML output format. If XML is not used, you provide clear, predictable headers for each section."
      };


      const response = await generateAIContent(request);

      if (response.success && response.content) {
        console.log(`[PremiumAnalysis] Success - Feature: ${feature}`);
        // DEBUG: Attach to window for extraction
        if (typeof window !== 'undefined') {
          (window as any)._lastAIResponse = (window as any)._lastAIResponse || {};
          (window as any)._lastAIResponse[feature] = response.content;
        }
        console.log(`[PremiumAnalysis] Raw Response for ${feature}:`, response.content);
        // Log original response if it seems short or suspicious
        if (response.content.length < 100) {
          console.warn(`[PremiumAnalysis] Unusually short response for ${feature}:`, response.content);
        }
        return response.content;
      } else {
        const errorMsg = response.error || 'AI analysis failed - no content returned';
        console.error(`[PremiumAnalysis] Failed for ${feature}:`, errorMsg);

        // Return a structured error so the parser can handle it
        return `ERROR: ${errorMsg}`;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[PremiumAnalysis] Runtime error for ${feature}:`, errorMsg);
      return `ERROR: Runtime Exception - ${errorMsg}`;
    }
  }

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

    // Sample middle elements evenly
    const midElementsRaw = elements.slice(startCount, -endCount);
    const midStep = Math.max(1, Math.floor(midElementsRaw.length / midCount));
    const midElements: ScriptElementType[] = [];
    for (let i = 0; i < midElementsRaw.length && midElements.length < midCount; i += midStep) {
      midElements.push(midElementsRaw[i]);
    }

    return [
      "--- SCRIPT START ---",
      this.formatScriptForAnalysis(startElements),
      "\n--- ... SCRIPT CONTINUES (SAMPLED MIDDLE) ... ---\n",
      this.formatScriptForAnalysis(midElements),
      "\n--- ... SCRIPT CONTINUES (END) ... ---\n",
      this.formatScriptForAnalysis(endElements),
      "--- SCRIPT END ---"
    ].join('\n');
  }

  private static getScriptContext(elements: ScriptElementType[], genre?: Genre, language?: Language, synopsis?: string, industry?: string): string {
    const sceneCount = elements.filter(el => el.type === 'heading').length;
    const characterCount = new Set(elements.filter(el => el.type === 'character').map(el => el.content.trim())).size;

    // Industry standard is roughly 50-55 elements per page for screenplays
    const pageEstimate = Math.max(1, Math.ceil(elements.length / 50));

    const cleanSynopsis = (synopsis === 'null' || synopsis === 'undefined' || !synopsis) ? 'Not provided' : synopsis;
    const cleanIndustry = (industry === 'null' || industry === 'undefined' || !industry) ? 'Not specified' : industry;

    return `Title: ${cleanIndustry} Project
Genre: ${genre || 'Not specified'}
Language: ${language || 'Not specified'}
Length: ${elements.length} elements (~${pageEstimate} pages)
Scenes: ${sceneCount}
Characters: ${characterCount}
Synopsis: ${cleanSynopsis}`;
  }

  static async performComprehensiveAnalysis(
    elements: ScriptElementType[],
    genre?: Genre,
    language?: Language,
    synopsis?: string,
    industry?: string
  ): Promise<PremiumAnalysisResult> {
    if (!elements || elements.length === 0) {
      throw new Error('No script content provided for analysis');
    }

    const sampledContent = this.getSampledScriptContent(elements);
    const context = this.getScriptContext(elements, genre, language, synopsis, industry);
    const timestamp = new Date().toISOString(); // BUST CACHE

    // Perform multiple AI analysis passes in 3 logical groups
    // Use 'revision' feature for all to avoid "generation" bias in edge functions

    const [marketingAnalysis, narrativeAnalysis, characterCulturalAnalysis] = await Promise.all([
      // Pass 1: Marketing & Technical
      this.analyzeWithAI(
        `[TIMESTAMP: ${timestamp}]
TASK: ANALYZE AND CONSULT. DO NOT WRITE SCRIPTS.
Provide a marketing and technical assessment. Your response MUST use the exact XML tags below:
<EXECUTIVE_SUMMARY> 3-4 sentence summary of story and potential </EXECUTIVE_SUMMARY>
<OVERALL_SCORE> A number from 0-100 </OVERALL_SCORE>
<MARKET_VIABILITY> Assessment of commercial potential </MARKET_VIABILITY>
<TARGET_AUDIENCE> Primary and secondary demographics </TARGET_AUDIENCE>
<COMMERCIAL_POTENTIAL> Film/TV/Streaming evaluation </COMMERCIAL_POTENTIAL>
<GENRE_CONVENTIONS> Comparison to genre standards </GENRE_CONVENTIONS>
<COMPETITIVE_ANALYSIS> Comparison to similar works </COMPETITIVE_ANALYSIS>
<MARKET_POSITIONING> Fit in current entertainment market </MARKET_POSITIONING>
<FESTIVAL_POTENTIAL> Festival and contest viability </FESTIVAL_POTENTIAL>
<FORMATTING_ASSESSMENT> Formatting correctness </FORMATTING_ASSESSMENT>
<SCENE_CRAFT> Construction of scenes </SCENE_CRAFT>
<WRITING_QUALITY> Prose and action line quality </WRITING_QUALITY>
<PROFESSIONAL_READINESS> Market-readiness evaluation </PROFESSIONAL_READINESS>`,
        sampledContent,
        context,
        'revision',
        synopsis,
        industry
      ),

      // Pass 2: Narrative & Pacing
      this.analyzeWithAI(
        `[TIMESTAMP: ${timestamp}]
TASK: ANALYZE AND CONSULT. DO NOT WRITE SCRIPTS.
Provide a structural plot and pacing analysis. Your response MUST use the exact XML tags below:
<STRUCTURE_BREAKDOWN> Three-act structure analysis </STRUCTURE_BREAKDOWN>
<THREE_ACT_ANALYSIS> Act-by-act evaluation </THREE_ACT_ANALYSIS>
<NARRATIVE_FLOW> Progression and transition analysis </NARRATIVE_FLOW>
<SUBPLOT_INTEGRATION> Evaluation of subplot effectiveness </SUBPLOT_INTEGRATION>
<CLIMAX_EFFECTIVENESS> Dramatic payoff analysis </CLIMAX_EFFECTIVENESS>
<OVERALL_RHYTHM> Assessment of speed and balance </OVERALL_RHYTHM>
<SCENE_BY_SCENE_PACING> Rhythmical analysis of individual scenes </SCENE_BY_SCENE_PACING>
<TENSION_CURVE> Map of tension build and release </TENSION_CURVE>
<PLOT_HOLES> List specific logic or continuity issues </PLOT_HOLES>
<SLOW_POINTS> List scenes where pacing drags </SLOW_POINTS>
<HIGHLIGHTS> List scenes with exceptional pacing/impact </HIGHLIGHTS>`,
        sampledContent,
        context,
        'revision',
        synopsis,
        industry
      ),

      // Pass 3: Character, Themes & Cultural
      this.analyzeWithAI(
        `[TIMESTAMP: ${timestamp}]
TASK: ANALYZE AND CONSULT. DO NOT WRITE SCRIPTS.
Provide a deep character, thematic and cultural analysis. Your response MUST use the exact XML tags below:
<CHARACTER_ARC_ANALYSIS> Detailed journey transformation analysis </CHARACTER_ARC_ANALYSIS>
<RELATIONSHIP_DYNAMICS> Analysis of character interactions </RELATIONSHIP_DYNAMICS>
<DIALOGUE_QUALITY> Assessment of voice, flow, and authenticity </DIALOGUE_QUALITY>
<PRIMARY_THEMES> Main themes with examples </PRIMARY_THEMES>
<THEME_EXECUTION> How well themes are woven into story </THEME_EXECUTION>
<THEMATIC_RESONANCE> Meaningfulness to target audience </THEMATIC_RESONANCE>
<SUBTEXT_ANALYSIS> Communication beneath the surface </SUBTEXT_ANALYSIS>
<SYMBOLISM_USAGE> Symbols and their effectiveness </SYMBOLISM_USAGE>
<AUTHENTICITY_ASSESSMENT> Overall cultural accuracy </AUTHENTICITY_ASSESSMENT>
<REPRESENTATION_QUALITY> Dimensionality of cultural groups </REPRESENTATION_QUALITY>
<LANGUAGE_AUTHENTICITY> Accuracy of dialects/local languages </LANGUAGE_AUTHENTICITY>
<CULTURAL_ELEMENTS> Specific cultural references/details </CULTURAL_ELEMENTS>
<IMPROVEMENTS> List 3-5 specific character or cultural improvements </IMPROVEMENTS>
<STRENGTHS> List 3-5 character or cultural strengths </STRENGTHS>`,
        sampledContent,
        context,
        'revision',
        synopsis,
        industry
      )
    ]);

    // Parse and structure the results
    return this.parseAnalysisResults({
      marketingAnalysis,
      narrativeAnalysis,
      characterCulturalAnalysis
    });
  }

  private static parseAnalysisResults(analyses: {
    marketingAnalysis: string;
    narrativeAnalysis: string;
    characterCulturalAnalysis: string;
  }): PremiumAnalysisResult {
    const { marketingAnalysis, narrativeAnalysis, characterCulturalAnalysis } = analyses;

    return {
      overview: {
        executiveSummary: this.extractSection(marketingAnalysis, 'EXECUTIVE_SUMMARY', 'Overall assessment of the script quality and potential.'),
        overallScore: this.extractScore(marketingAnalysis) || 75,
        marketViability: this.extractSection(marketingAnalysis, 'MARKET_VIABILITY', 'Market potential assessment needed.'),
        targetAudience: this.extractSection(marketingAnalysis, 'TARGET_AUDIENCE', 'Target audience analysis needed.'),
        commercialPotential: this.extractSection(marketingAnalysis, 'COMMERCIAL_POTENTIAL', 'Commercial viability assessment needed.')
      },
      characterAnalysis: {
        arcAnalysis: this.extractSection(characterCulturalAnalysis, 'CHARACTER_ARC_ANALYSIS', 'Character development analysis needed.'),
        characterBreakdown: this.parseCharacterBreakdown(characterCulturalAnalysis),
        dialogueQuality: {
          analysis: this.extractSection(characterCulturalAnalysis, 'DIALOGUE_QUALITY', 'Dialogue quality assessment needed.'),
          strengths: this.extractListItems(characterCulturalAnalysis, 'STRENGTHS'),
          improvements: this.extractListItems(characterCulturalAnalysis, 'IMPROVEMENTS'),
          voiceConsistency: this.extractScore(characterCulturalAnalysis) || 70
        }
      },
      plotAnalysis: {
        structureBreakdown: this.extractSection(narrativeAnalysis, 'STRUCTURE_BREAKDOWN', 'Plot structure analysis needed.'),
        threeActAnalysis: this.extractSection(narrativeAnalysis, 'THREE_ACT_ANALYSIS', 'Three-act analysis needed.'),
        plotHoles: this.parsePlotHoles(narrativeAnalysis),
        narrativeFlow: this.extractSection(narrativeAnalysis, 'NARRATIVE_FLOW', 'Narrative flow assessment needed.'),
        subplotIntegration: this.extractSection(narrativeAnalysis, 'SUBPLOT_INTEGRATION', 'Subplot analysis needed.'),
        climaxEffectiveness: this.extractSection(narrativeAnalysis, 'CLIMAX_EFFECTIVENESS', 'Climax effectiveness evaluation needed.')
      },
      pacingAnalysis: {
        overallRhythm: this.extractSection(narrativeAnalysis, 'OVERALL_RHYTHM', 'Pacing assessment needed.'),
        sceneByScenePacing: this.extractSection(narrativeAnalysis, 'SCENE_BY_SCENE_PACING', 'Scene pacing analysis needed.'),
        tensionCurve: this.extractSection(narrativeAnalysis, 'TENSION_CURVE', 'Tension analysis needed.'),
        slowPoints: this.parseIssues(narrativeAnalysis, 'SLOW_POINTS'),
        highlights: this.parseHighlights(narrativeAnalysis)
      },
      themeAnalysis: {
        primaryThemes: this.extractListItems(characterCulturalAnalysis, 'PRIMARY_THEMES'),
        themeExecution: this.extractSection(characterCulturalAnalysis, 'THEME_EXECUTION', 'Theme execution analysis needed.'),
        thematicResonance: this.extractSection(characterCulturalAnalysis, 'THEMATIC_RESONANCE', 'Thematic resonance assessment needed.'),
        subtextAnalysis: this.extractSection(characterCulturalAnalysis, 'SUBTEXT_ANALYSIS', 'Subtext analysis needed.'),
        symbolismUsage: this.extractSection(characterCulturalAnalysis, 'SYMBOLISM_USAGE', 'Symbolism analysis needed.')
      },
      culturalAnalysis: {
        authenticityAssessment: this.extractSection(characterCulturalAnalysis, 'AUTHENTICITY_ASSESSMENT', 'Authenticity assessment needed.'),
        culturalElements: this.parseCulturalElements(characterCulturalAnalysis),
        representationQuality: this.extractSection(characterCulturalAnalysis, 'REPRESENTATION_QUALITY', 'Representation quality assessment needed.'),
        improvementSuggestions: this.extractListItems(characterCulturalAnalysis, 'IMPROVEMENTS')
      },
      industryComparison: {
        genreConventions: this.extractSection(marketingAnalysis, 'GENRE_CONVENTIONS', 'Genre convention analysis needed.'),
        competitiveAnalysis: this.extractSection(marketingAnalysis, 'COMPETITIVE_ANALYSIS', 'Competitive analysis needed.'),
        marketPositioning: this.extractSection(marketingAnalysis, 'MARKET_POSITIONING', 'Market positioning assessment needed.'),
        festivalPotential: this.extractSection(marketingAnalysis, 'FESTIVAL_POTENTIAL', 'Festival potential evaluation needed.')
      },
      actionableRecommendations: this.parseRecommendations(analyses),
      technicalAssessment: {
        formatting: this.extractSection(marketingAnalysis, 'FORMATTING_ASSESSMENT', 'Formatting assessment needed.'),
        sceneCraft: this.extractSection(marketingAnalysis, 'SCENE_CRAFT', 'Scene craft evaluation needed.'),
        writingQuality: this.extractSection(marketingAnalysis, 'WRITING_QUALITY', 'Writing quality assessment needed.'),
        professionalReadiness: this.extractSection(marketingAnalysis, 'PROFESSIONAL_READINESS', 'Professional readiness evaluation needed.')
      }
    };
  }

  private static extractSection(text: string, keyword: string, fallback: string): string {
    if (!text || text.trim().length === 0) return fallback;

    // Handle AI Service Errors
    if (text.startsWith('ERROR:')) {
      return `Analysis Error: ${text.substring(6).trim()}`;
    }

    const cleanText = text.replace(/^\s*```[a-z]*\s*/, '').replace(/\s*```\s*$/, '');

    // 1. Try Tag-based pattern (Case-Insensitive)
    const normalizedKeyword = keyword.replace(/_/g, '[\\s_-]+');

    // Improved tag pattern that handles potential whitespace or minor character changes
    const tagPattern = new RegExp(`<${normalizedKeyword}[^>]*>([\\s\\S]*?)</${normalizedKeyword}>`, 'i');
    const tagMatch = cleanText.match(tagPattern);
    if (tagMatch && tagMatch[1]) {
      const content = this.cleanExtractedContent(tagMatch[1]);
      if (content.length > 5 && !content.includes('N/A')) return content;
    }

    // 2. Try Markdown/Header pattern with improved lookahead
    // This lookahead checks for either a new header, a new XML tag, or a new Key: Value pair
    const headerPattern = new RegExp(`(?:###|##|#|\\*\\*|\\d+\\.)\\s*${normalizedKeyword}[\\s\\S]*?(?:\\n|:)([\\s\\S]*?)(?=\\n\\s*(?:###|##|#|\\*\\*|[-*]|<|[A-Z_]{5,}:)|$)`, 'i');
    const headerMatch = cleanText.match(headerPattern);
    if (headerMatch && headerMatch[1]) {
      const content = this.cleanExtractedContent(headerMatch[1]);
      if (content.length > 5) return content;
    }

    // 3. Try Colon-based pattern (e.g., EXECUTIVE SUMMARY: Content)
    const colonPattern = new RegExp(`(?:^|\\n)\\s*${normalizedKeyword}[:\\s]+([\\s\\S]*?)(?=\\n\\s*(?:[A-Z_]{5,}[:]|###|##|#|<)|$)`, 'i');
    const colonMatch = cleanText.match(colonPattern);
    if (colonMatch && colonMatch[1]) {
      const content = this.cleanExtractedContent(colonMatch[1]);
      if (content.length > 5) return content;
    }

    // 4. JSON-like block detection (AI sometimes outputs JSON even when asked for XML)
    if (cleanText.includes('{') && cleanText.includes(':')) {
      try {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          // Check for exact key or case-insensitive key
          const value = jsonData[keyword] || jsonData[keyword.toLowerCase()] ||
            Object.entries(jsonData).find(([k]) => k.toLowerCase() === keyword.toLowerCase() ||
              k.toLowerCase().replace(/_/g, '') === keyword.toLowerCase().replace(/_/g, ''))?.[1];
          if (value && typeof value === 'string' && value.length > 10) return value;
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }

    // 5. Extreme Loose Match (Just find the word and take the next paragraph)
    const loosePattern = new RegExp(`${normalizedKeyword}[\\s\\S]*?[:\\n\\?]+([\\s\\S]*?)(?=\\n\\n|\\n\\s*(?:###|##|#|[A-Z_]{5,}:)|$)`, 'i');
    const looseMatch = cleanText.match(loosePattern);
    if (looseMatch && looseMatch[1]) {
      const content = this.cleanExtractedContent(looseMatch[1]);
      if (content.length > 5) return content;
    }

    // 6. Sentence Match Fallback - Look for keyword in a substantial paragraph
    const lines = cleanText.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase().replace(/_/g, ' ')) && line.length > 100) {
        return this.cleanExtractedContent(line);
      }
    }

    // Debugging: Log failures to console for developer visibility
    if (cleanText.length > 100 && !keyword.includes('IMPROVEMENTS') && !keyword.includes('STRENGTHS')) {
      console.warn(`[PremiumExtraction] Failed for ${keyword}. Length: ${cleanText.length}. Preview: ${cleanText.substring(0, 150).replace(/\n/g, ' ')}`);
    }

    return fallback;
  }

  private static cleanExtractedContent(text: string): string {
    return text.trim()
      .replace(/^\s*[:\-]\s*/, '')
      .replace(/^\*+\s*/, '')
      .replace(/^#+\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static extractScore(text: string): number | null {
    if (!text) return null;

    // Case-insensitive XML tag match
    const tagMatch = text.match(/<(?:OVERALL_SCORE|score|rating)[^>]*>[:\s]*(\d+)[:\s]*<\//i);
    if (tagMatch && tagMatch[1]) return parseInt(tagMatch[1]);

    const keywords = ['score', 'rating', 'overall', 'overall_score'];
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[:\\s]*(?:is\\s*)?(\\d+)`, 'i');
      const match = text.match(pattern);
      if (match && match[1]) {
        const score = parseInt(match[1]);
        if (score >= 0 && score <= 100) return score;
      }
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes('excellent')) return 92;
    if (lowerText.includes('very good') || lowerText.includes('strong')) return 85;
    if (lowerText.includes('good') || lowerText.includes('solid')) return 78;
    if (lowerText.includes('average')) return 68;
    if (lowerText.includes('weak')) return 55;
    if (lowerText.includes('poor')) return 35;

    return null;
  }

  private static extractListItems(text: string, keyword: string): string[] {
    if (!text || text.trim().length === 0) return [`${keyword} analysis needed`];

    // Case-insensitive XML tag match
    const tagPattern = new RegExp(`<${keyword}[^>]*>([\\s\\S]*?)</${keyword}>`, 'i');
    const tagMatch = text.match(tagPattern);

    let sectionText = '';
    if (tagMatch && tagMatch[1]) {
      sectionText = tagMatch[1];
    } else {
      const normalizedKeyword = keyword.replace(/_/g, '[\\s_]+');
      const patterns = [
        new RegExp(`(?:###|##|#|\\*\\*|\\d+\\.)\\s*${normalizedKeyword}[\\s\\S]*?(?:\\n|:)([\\s\\S]*?)(?=\\n\\s*(?:###|##|#|\\*\\*|[-*]|<|[A-Z_]{5,}:)|$)`, 'i'),
        new RegExp(`${normalizedKeyword}[:\\s]*([\\s\\S]*?)(?=\\n\\s*(?:[A-Z_]{5,}[:]|###|##|#|<)|$)`, 'i'),
        new RegExp(`${normalizedKeyword}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\n|\\n\\s*(?:###|##|#|[A-Z_]{5,}:)|$)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          sectionText = match[1];
          break;
        }
      }
    }

    if (!sectionText) {
      // Fallback: If the text is short, maybe it *is* the list
      if (text.length < 500 && (text.includes('-') || text.includes('•') || text.match(/^\d\./))) {
        sectionText = text;
      }
    }

    if (!sectionText) return [`${keyword} analysis needed`];

    const items: string[] = [];
    // Split by common list delimiters and lines
    const rawItems = sectionText.split(/\n|(?:\s*-\s+)|(?:\s*•\s+)|(?:\s*\d+\.\s+)/);

    for (const rawItem of rawItems) {
      let item = rawItem.trim();

      // Clean up common artifacts
      item = item
        .replace(/^[:\-•*\d\.]+\s*/, '')
        .replace(/^\*+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (item.length > 5 &&
        !item.toLowerCase().includes('needed') &&
        !item.toLowerCase().includes('error') &&
        !item.match(/^[A-Z_]{5,}:/)) {
        items.push(item);
      }
    }

    // If no items found, try splitting by sentences as a last resort
    if (items.length === 0) {
      const sentences = sectionText.split(/[.!?]+(?=\s|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 15 &&
          !s.toLowerCase().includes('needed') &&
          !s.toLowerCase().includes('error') &&
          !s.match(/^[A-Z_]{5,}:/));

      if (sentences.length > 0) {
        return sentences.slice(0, 5);
      }
    }

    return items.length > 0 ? items : [`${keyword} analysis needed`];
  }

  private static parseCharacterBreakdown(text: string): Array<{
    name: string;
    arc: string;
    consistency: number;
    voiceAnalysis: string;
    relationshipDynamics: string;
    developmentSuggestions: string[];
  }> {
    return [
      {
        name: 'Protagonist',
        arc: this.extractSection(text, 'CHARACTER_ARC_ANALYSIS', 'Character arc analysis needed'),
        consistency: this.extractScore(text) || 75,
        voiceAnalysis: this.extractSection(text, 'DIALOGUE_QUALITY', 'Voice analysis needed'),
        relationshipDynamics: this.extractSection(text, 'RELATIONSHIP_DYNAMICS', 'Relationship analysis needed'),
        developmentSuggestions: this.extractListItems(text, 'IMPROVEMENTS')
      }
    ];
  }

  private static parsePlotHoles(text: string): Array<{
    description: string;
    severity: 'critical' | 'moderate' | 'minor';
    location: string;
    solution: string;
  }> {
    const issues = this.extractListItems(text, 'PLOT_HOLES');
    if (issues.length === 1 && issues[0].includes('analysis needed')) return [];

    return issues.map(issue => ({
      description: issue,
      severity: 'moderate' as const,
      location: 'See Plot Analysis section',
      solution: 'Suggest refining this logic in the rewrite'
    }));
  }

  private static parseIssues(text: string, type: string): Array<{
    location: string;
    issue: string;
    solution: string;
  }> {
    const issues = this.extractListItems(text, type);
    if (issues.length === 1 && issues[0].includes('analysis needed')) return [];

    return issues.map(issue => ({
      location: 'See Pacing Analysis',
      issue,
      solution: 'Refer to pacing recommendations'
    }));
  }

  private static parseHighlights(text: string): Array<{
    location: string;
    description: string;
    whatWorks: string;
  }> {
    const highlights = this.extractListItems(text, 'HIGHLIGHTS');
    if (highlights.length === 1 && highlights[0].includes('analysis needed')) return [];

    return highlights.map(highlight => ({
      location: 'Identified Scene',
      description: highlight,
      whatWorks: 'Strong execution and impact'
    }));
  }

  private static parseCulturalElements(text: string): Array<{
    element: string;
    accuracy: 'authentic' | 'questionable' | 'problematic';
    feedback: string;
  }> {
    const elements = this.extractListItems(text, 'CULTURAL_ELEMENTS');
    if (elements.length === 1 && elements[0].includes('analysis needed')) return [];

    return elements.map(element => ({
      element,
      accuracy: 'authentic' as const,
      feedback: 'Cultural context aligns with specified industry/region'
    }));
  }

  private static parseRecommendations(analyses: any): Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'structure' | 'character' | 'dialogue' | 'pacing' | 'theme' | 'cultural';
    title: string;
    description: string;
    specificSteps: string[];
    examples?: string;
  }> {
    const recommendations: any[] = [];

    Object.entries(analyses).forEach(([key, text]: [string, any]) => {
      const suggestions = this.extractListItems(text as string, 'IMPROVEMENTS');
      if (suggestions.length === 1 && suggestions[0].includes('analysis needed')) return;

      suggestions.forEach(suggestion => {
        recommendations.push({
          priority: 'high' as const,
          category: this.mapCategoryFromKey(key),
          title: `${key.replace(/Analysis$/, '')} Improvement`,
          description: suggestion,
          specificSteps: ['Refer to the detailed analysis section for context'],
          examples: 'Reference specific scenes in the script'
        });
      });
    });

    return recommendations;
  }

  private static mapCategoryFromKey(key: string): 'structure' | 'character' | 'dialogue' | 'pacing' | 'theme' | 'cultural' {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('character')) return 'character';
    if (lowerKey.includes('plot') || lowerKey.includes('structure')) return 'structure';
    if (lowerKey.includes('pacing')) return 'pacing';
    if (lowerKey.includes('theme')) return 'theme';
    if (lowerKey.includes('cultural')) return 'cultural';
    return 'dialogue';
  }
}