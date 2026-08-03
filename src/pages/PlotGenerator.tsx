import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Genre, Language, ScriptType, FilmIndustry } from "@/types";
import { v4 as uuid } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { saveSynopsis } from "@/services/synopsis-service";
import { parseScriptElements } from "@/utils/scriptElementParser";
import { getIndustryAIPromptContext, filmIndustryContexts } from "@/utils/filmIndustryContext";
import { getScriptTypeGuidance, getScriptTypeContext } from "@/utils/scriptTypeGuidance";
import { getOptionsForIndustry } from "@/utils/industryOptions";
import { deductAICredits, fetchAICredits } from "@/hooks/useAICredits";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useRef } from "react";


interface SynopsisOption {
  id: string;
  title: string;
  content: string;
  tone: string;
}

interface PlotSettings {
  tone: string;
  period: string;
  setting: string;
  pace: string;
  language: Language;
  scenesNumber: number;
}

export default function PlotGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step tracking
  const [currentStep, setCurrentStep] = useState<'synopsis' | 'plotting' | 'settings' | 'generating'>('synopsis');

  // Initial data from script creation
  const [initialData, setInitialData] = useState<{
    title: string;
    genre: Genre;
    storyIdea: string;
    scriptType?: ScriptType;
    filmIndustry?: FilmIndustry;
    episodicStructure?: string;
    seasonPlan?: {
      episodeCount: number;
      seasonTheme: string;
      episodes: Array<{
        episodeNumber: number;
        title: string;
        storyBeat: string;
      }>;
    };
  } | null>(null);

  // Synopsis generation
  const [synopsisOptions, setSynopsisOptions] = useState<SynopsisOption[]>([]);
  const [selectedSynopsis, setSelectedSynopsis] = useState<SynopsisOption | null>(null);
  const [isGeneratingSynopses, setIsGeneratingSynopses] = useState(false);
  const [customSynopsisInstruction, setCustomSynopsisInstruction] = useState("");

  // Plot settings
  const [plotSettings, setPlotSettings] = useState<PlotSettings>({
    tone: '',
    period: '',
    setting: '',
    pace: '',
    language: Language.ENGLISH,
    scenesNumber: 15
  });

  // Batched script generation
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [generatedScenes, setGeneratedScenes] = useState<string[]>([]);
  const [plotMap, setPlotMap] = useState<any[]>([]);
  const [isGeneratingPlotMap, setIsGeneratingPlotMap] = useState(false);

  // Multi-episode tracking
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [isMultiEpisode, setIsMultiEpisode] = useState(false);

  // Background stability refs
  const currentBatchRef = useRef(0);
  const isGeneratingRef = useRef(false);

  // Automatic Wake Lock management
  const { isActive: isWakeLockActive } = useWakeLock(isGeneratingScript || isGeneratingSynopses || isGeneratingPlotMap);

  // Sync refs with state for background recovery
  useEffect(() => {
    isGeneratingRef.current = isGeneratingScript;
  }, [isGeneratingScript]);

  useEffect(() => {
    currentBatchRef.current = currentBatch;
  }, [currentBatch]);

  // Handle visibility changes for batch generation recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isGeneratingRef.current) {
        console.log('[PlotGenerator] Tab became visible. Checking generation state...', {
          batch: currentBatchRef.current,
          progress: generationProgress
        });
        
        toast({
          title: "Synchronizing...",
          description: `Resuming screenplay generation at batch ${currentBatchRef.current}.`,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [generationProgress, toast]);

  // Load initial data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('plotGeneratorData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setInitialData(data);
      localStorage.removeItem('plotGeneratorData'); // Clean up

      // Adjust default scenes for Skit and Series
      if (data.scriptType === ScriptType.SKIT) {
        setPlotSettings(prev => ({ ...prev, scenesNumber: 3 }));
      } else if (data.scriptType === ScriptType.TV_SERIES || data.scriptType === ScriptType.WEB_SERIES) {
        setPlotSettings(prev => ({ ...prev, scenesNumber: 13 }));
      }

      // Check if coming from saved synopsis
      if (data.fromSynopsis) {
        if (data.synopsisId) {
          // Fetch full synopsis content if only ID was passed (to avoid localStorage quota)
          const fetchSynopsis = async () => {
            try {
              const { data: synopsisData, error } = await supabase
                .from('synopses')
                .select('*')
                .eq('id', data.synopsisId)
                .single();

              if (error) throw error;

              const savedSynopsisOption: SynopsisOption = {
                id: synopsisData.id,
                title: synopsisData.title,
                content: synopsisData.content,
                tone: data.savedSynopsis?.tone || 'Dramatic'
              };

              setSynopsisOptions([savedSynopsisOption]);
              setSelectedSynopsis(savedSynopsisOption);
              setPlotSettings(prev => ({ ...prev, tone: savedSynopsisOption.tone }));
              // Go to synopsis step so user can proceed through plot mapping
              setCurrentStep('synopsis');
            } catch (err) {
              console.error('Error fetching synopsis:', err);
              toast({
                title: "Error",
                description: "Failed to load saved synopsis content.",
                variant: "destructive"
              });
            }
          };
          fetchSynopsis();
        } else if (data.savedSynopsis) {
          // Fallback for when content was passed directly (legacy/small synopses)
          const savedSynopsisOption: SynopsisOption = {
            id: data.savedSynopsis.id,
            title: data.savedSynopsis.title,
            content: data.savedSynopsis.content,
            tone: data.savedSynopsis.tone
          };

          setSynopsisOptions([savedSynopsisOption]);
          setSelectedSynopsis(savedSynopsisOption);
          setPlotSettings(prev => ({ ...prev, tone: data.savedSynopsis.tone }));
          // Go to synopsis step so user can proceed through plot mapping
          setCurrentStep('synopsis');

          toast({
            title: "Synopsis Loaded",
            description: "Click 'Continue' to architect the narrative plot map before generating your script.",
          });
        }
      } else {
        // Auto-generate synopsis options (existing behavior)
        generateSynopsisOptions(data);
      }
    }
  }, []);

  const generateSynopsisOptions = async (data: {
    title: string;
    genre: Genre;
    storyIdea: string;
    scriptType?: ScriptType;
    filmIndustry?: FilmIndustry;
    episodicStructure?: string;
    episodicStructure?: string;
    seasonPlan?: any;
  }, customInstruction?: string) => {
    if (isGeneratingSynopses) return;
    setIsGeneratingSynopses(true);
    setSynopsisOptions([]);

    // Check and deduct AI credits before generation (5 credits for 3 synopsis options)
    const creditResult = await deductAICredits(5, 'synopsis_generation', 'Generated 3 synopsis options');
    if (!creditResult.success) {
      toast({
        title: "Insufficient AI Credits",
        description: creditResult.message || "You need at least 5 credits to generate synopses.",
        variant: "destructive"
      });
      setIsGeneratingSynopses(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const isSeries = data.scriptType === ScriptType.TV_SERIES || data.scriptType === ScriptType.WEB_SERIES;
      const isSkit = data.scriptType === ScriptType.SKIT;
      const skitConstraints = isSkit ? `
CRITICAL SKIT CONSTRAINTS:
1. SMALL CAST: 1-4 characters maximum.
2. SINGLE LOCATION: Keep the action in one main location.
3. DURATION: Story must fit into 2-5 minutes.
4. STRUCTURE: Use a clear Setup -> Twist -> Payoff (Punchline) flow.
5. HOOK: Start with a strong immediate hook.
` : '';

      const scenarios = isSkit ? [
        { tone: 'Witty', period: 'Modern Day', setting: 'Urban', pace: 'Fast', description: "Create a witty and clever story with sharp dialogue and unexpected turns" },
        { tone: 'Dramatic', period: 'Modern Day', setting: 'Local', pace: 'Moderate', description: "Create a dramatic and emotionally intense story with deep character development and complex themes" },
        { tone: 'Satirical', period: 'Contemporary', setting: 'Everyday Life', pace: 'Snappy', description: "Create a satirical story that uses humor, irony, or exaggeration to criticize or expose human folly" }
      ] : isSeries ? [
        { tone: 'Seasonal Flow', description: "Create a comprehensive seasonal plan mapping out the overarching narrative and providing brief synopses for every individual episode in the season." }
      ] : [
        { tone: "Dramatic", description: "Create a dramatic and emotionally intense story with deep character development and complex themes" },
        { tone: "Light-hearted", description: "Create a light-hearted and uplifting story with humor, optimism, and heartwarming moments" },
        { tone: "Suspenseful", description: "Create a suspenseful and thrilling story with tension, mystery, and unexpected plot twists" }
      ];

      const options: SynopsisOption[] = [];

      // Get film industry context if available
      const industryContext = data.filmIndustry ? getIndustryAIPromptContext(data.filmIndustry) : '';
      const scriptTypeText = data.scriptType ? ` ${data.scriptType}` : '';
      const scriptTypeGuidance = data.scriptType ? getScriptTypeGuidance(data.scriptType, data.episodicStructure) : '';

      // Get season plan context if available
      const seasonPlanContext = data.seasonPlan ? `\n## SEASON PLAN CONTEXT\nSeason Theme: ${data.seasonPlan.seasonTheme}\nTotal Episodes: ${data.seasonPlan.episodeCount}\nOverall Season Flow:\n${data.seasonPlan.episodes.slice(0, 5).map((e: any) => `Episode ${e.episodeNumber}: ${e.title} - ${e.storyBeat}`).join('\n')}\n` : '';

      const promptStructure = isSeries ? `
**OVERALL SEASON PLAN:**
A comprehensive summary of the season's overarching narrative arc and central conflict.

**EPISODE SYNOPSES:**
Provide a brief, compelling 1-2 paragraph synopsis for EVERY episode in the season, showing the progression of the story.

**SEASONAL CHARACTER ARCS:**
Briefly describe the season-long character arc for the protagonist and main supporting cast.
` : `
**FULL SYNOPSIS (6-8 detailed paragraphs):**
- Opening situation: Establish the world, main character's ordinary life, and inciting incident
- First act development: How the protagonist is drawn into the central conflict
- Second act complications: Major obstacles, character growth, relationship dynamics
- Midpoint crisis: The turning point that changes everything
- Third act escalation: Rising action, climax preparation, character transformations
- Climax and resolution: How conflicts are resolved and character arcs completed
- Themes and deeper meaning: What the story says about the human condition
- Cultural authenticity: Authentic cultural dynamics and realistic character motivations
`;

      for (const scenario of scenarios) {
        const synopsisPrompt = `Create a comprehensive professional treatment for a ${scenario.tone.toLowerCase()} ${data.genre}${scriptTypeText} titled "${data.title}".

${customInstruction ? `\n\nUSER's CUSTOM INSTRUCTION: ${customInstruction}\nMake sure to strictly incorporate the above instruction into this treatment.\n\n` : ''}${industryContext ? `\n${industryContext}\n\nIMPORTANT: Adapt this story to the specified film industry style above. Incorporate appropriate:\n- Language patterns and dialogue styles\n- Cultural references and nuances\n- Story structure conventions\n- Character naming and development\n- Setting and atmosphere specific to this industry\n\n` : ''}${scriptTypeGuidance ? `${scriptTypeGuidance}\n\nIMPORTANT: Structure this treatment according to the script type guidance above. Consider:\n- The unique structural requirements of this format\n- Appropriate pacing and story arc for this type\n- Character development suited to this medium\n- Any format-specific storytelling conventions\n\n` : ''}${skitConstraints}${seasonPlanContext ? `${seasonPlanContext}\n\nIMPORTANT: Use the season plan above to ensure this episode or series treatment fits into the larger narrative arc specified.\n\n` : ''}Story concept: ${data.storyIdea}

The treatment should be extensive and detailed, including:

**LOGLINE:**
A compelling one-sentence summary that captures the essence, stakes, and unique appeal of the story.
${promptStructure}

**DETAILED CHARACTER PROFILES:**
- PROTAGONIST: Full name (appropriate to the cultural context), age, occupation, detailed background, personality traits, internal conflicts, external goals, character arc from beginning to end
- ANTAGONIST: Full name, motivation, background, how they oppose the protagonist, their own believable goals and justifications
- SUPPORTING CHARACTERS: 3-4 key supporting characters with names, relationships, roles in the story, and brief but specific backgrounds

**SETTING & ATMOSPHERE:**
- Primary locations with vivid descriptions
- Time period and cultural atmosphere
- Specific regional/cultural context and social dynamics
- Visual style and mood throughout different acts
- How setting influences character behavior and plot development

**THEMES & CULTURAL ELEMENTS:**
- Central themes explored throughout the narrative
- Cultural authenticity and social commentary
- Universal human experiences that transcend cultural boundaries
- How tradition and modernity intersect in the story

**STORY STRUCTURE:**
- Appropriate structure for the selected film industry
- Key plot points and their emotional impact
- Pacing and rhythm appropriate for the genre and industry style
- How tension builds and releases throughout the narrative

Make this treatment comprehensive, engaging, and suitable for ${scenario.description.toLowerCase()}. ${industryContext ? 'Ensure the story authentically reflects the selected film industry\'s storytelling conventions, cultural nuances, and production style.' : 'Ensure high cultural authenticity with realistic characters, settings, and social dynamics while maintaining universal appeal.'}`;

        console.log(`Generating comprehensive ${scenario.tone} synopsis...`);

        try {
          const { data: aiResponse, error } = await supabase.functions.invoke('generate-plot-content', {
            body: {
              promptType: 'plot',
              genre: data.genre,
              seedPlot: synopsisPrompt,
              culturalAuthenticity: 90,
              includeTraditional: true,
              setting: { region: "Nigeria" }
            }
          });

          if (error) {
            console.error(`Error generating ${scenario.tone} synopsis:`, error);
            continue;
          }

          if (aiResponse && aiResponse.success && aiResponse.content) {
            // Check if this was a cache hit
            if (aiResponse.cache_info?.status === 'cache_hit') {
              toast({
                title: "⚡ Instant Generation",
                description: "Content delivered from cache (< 1 second)",
                duration: 3000,
              });
            }

            const synopsisOption = {
              id: `synopsis-${scenario.tone.toLowerCase()}`,
              title: `${scenario.tone} ${data.genre} Treatment`,
              content: aiResponse.content,
              tone: scenario.tone
            };
            options.push(synopsisOption);

            // Save synopsis to database
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await saveSynopsis({
                  title: synopsisOption.title,
                  content: synopsisOption.content,
                  userId: user.id
                });
              }
            } catch (saveError) {
              console.warn('Failed to save synopsis:', saveError);
            }
          }
        } catch (requestError) {
          console.error(`Request error for ${scenario.tone}:`, requestError);
        }
      }

      setSynopsisOptions(options);

      if (options.length > 0) {
        toast({
          title: "Professional Treatments Generated",
          description: `${options.length} comprehensive story treatments created and saved.`,
        });
      }
    } catch (error) {
      console.error('Error generating synopsis options:', error);
      toast({
        title: "Error",
        description: "Failed to generate synopsis options. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSynopses(false);
    }
  };

  const generatePlotMap = async (synopsis: SynopsisOption) => {
    if (isGeneratingPlotMap) return;
    setIsGeneratingPlotMap(true);
    setCurrentStep('plotting');

    try {
      const { data: response, error } = await supabase.functions.invoke('generate-plot-content', {
        body: {
          promptType: 'plot_map',
          genre: initialData?.genre,
          seedPlot: synopsis.content,
          scenesNumber: plotSettings.scenesNumber,
          tone: plotSettings.tone,
          language: plotSettings.language,
          bypassCache: true
        }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        throw error;
      }

      console.log('Plot mapping response:', response);

      if (response && response.success && response.content) {
        console.log('=== PLOT MAPPING DEBUG START ===');
        if (response.debug_request) {
          console.log('AI Request Body (DEBUG):', response.debug_request);
        }
        console.log('Raw response length:', response.content.length);
        console.log('First 200 chars:', response.content.substring(0, 200));
        console.log('Last 200 chars:', response.content.substring(response.content.length - 200));

        // Attempt to parse JSON array from response
        try {
          // 1. Initial cleanup
          let jsonStr = response.content.replace(/```json|```/gi, '').trim();
          console.log('After cleanup, length:', jsonStr.length);
          console.log('Starts with:', jsonStr.substring(0, 50));

          // 2. HELPER: Auto-repair truncated JSON (close open brackets)
          const repairJson = (str: string) => {
            console.log('REPAIR: Attempting to repair JSON...');
            let openBraces = 0;
            let openBrackets = 0;
            let inString = false;
            let escaped = false;

            for (let i = 0; i < str.length; i++) {
              const char = str[i];
              if (escaped) { escaped = false; continue; }
              if (char === '\\') { escaped = true; continue; }
              if (char === '"') { inString = !inString; continue; }
              if (inString) continue;

              if (char === '{') openBraces++;
              if (char === '}') openBraces--;
              if (char === '[') openBrackets++;
              if (char === ']') openBrackets--;
            }

            console.log('REPAIR: Open braces:', openBraces, 'Open brackets:', openBrackets, 'In string:', inString);

            let repaired = str;
            // Close unclosed strings first
            if (inString) repaired += '"';
            // Close unclosed objects/arrays
            while (openBraces > 0) { repaired += '}'; openBraces--; }
            while (openBrackets > 0) { repaired += ']'; openBrackets--; }

            console.log('REPAIR: Repaired length:', repaired.length);
            return repaired;
          };

          // 3. Super-Robust Discovery: Find the BEST candidate for a JSON block
          const findJsonBlock = (str: string) => {
            console.log('DISCOVERY: Finding JSON block...');
            const arrayStart = str.indexOf('[');
            const objStart = str.indexOf('{');

            console.log('DISCOVERY: Array starts at:', arrayStart, 'Object starts at:', objStart);

            let startIdx = -1;
            if (arrayStart !== -1 && objStart !== -1) startIdx = Math.min(arrayStart, objStart);
            else if (arrayStart !== -1) startIdx = arrayStart;
            else if (objStart !== -1) startIdx = objStart;

            if (startIdx === -1) {
              console.error('DISCOVERY: No JSON structure found!');
              return null;
            }

            // Find the furthest possible matching end
            const arrayEnd = str.lastIndexOf(']');
            const objEnd = str.lastIndexOf('}');
            let endIdx = Math.max(arrayEnd, objEnd);

            console.log('DISCOVERY: Array ends at:', arrayEnd, 'Object ends at:', objEnd, 'Using:', endIdx);

            // If no end found, or end is before start, we definitely need repair
            if (endIdx === -1 || endIdx < startIdx) {
              console.warn('DISCOVERY: Malformed JSON detected, attempting repair...');
              return repairJson(str.substring(startIdx));
            }

            const extracted = str.substring(startIdx, endIdx + 1);
            console.log('DISCOVERY: Extracted block length:', extracted.length);
            return extracted;
          };

          const candidate = findJsonBlock(jsonStr);
          if (!candidate) {
            console.error('ERROR: No JSON candidate found');
            throw new Error('No JSON structure found in response.');
          }

          console.log('PARSING: Attempting to parse candidate...');
          let parsedData;
          try {
            parsedData = JSON.parse(candidate);
            console.log('PARSING: Success! Type:', typeof parsedData, 'Is array:', Array.isArray(parsedData));
          } catch (e) {
            console.warn('PARSING: Initial parse failed, attempting repair...', e);
            const repaired = repairJson(candidate);
            console.log('PARSING: Repaired candidate length:', repaired.length);
            parsedData = JSON.parse(repaired);
            console.log('PARSING: Repair successful! Type:', typeof parsedData);
          }

          let parsedMap: any[] = [];

          // 4. Advanced Discovery: Look for ANY array within the parsed object
          const discoverArray = (obj: any): any[] | null => {
            console.log('ARRAY DISCOVERY: Searching for array in parsed data...');
            console.log('ARRAY DISCOVERY: Type:', typeof obj, 'Is array:', Array.isArray(obj));

            if (Array.isArray(obj)) {
              console.log('ARRAY DISCOVERY: Found direct array with', obj.length, 'items');
              return obj;
            }

            if (obj && typeof obj === 'object') {
              console.log('ARRAY DISCOVERY: Searching object keys:', Object.keys(obj));

              // Priority 1: "scenes" or "plot" keys
              if (Array.isArray(obj.scenes)) {
                console.log('ARRAY DISCOVERY: Found "scenes" array with', obj.scenes.length, 'items');
                return obj.scenes;
              }
              if (Array.isArray(obj.plot)) {
                console.log('ARRAY DISCOVERY: Found "plot" array with', obj.plot.length, 'items');
                return obj.plot;
              }

              // Priority 2: Any key that is an array
              for (const key in obj) {
                if (Array.isArray(obj[key])) {
                  console.log('ARRAY DISCOVERY: Found array at key "' + key + '" with', obj[key].length, 'items');
                  return obj[key];
                }
              }
            }

            console.error('ARRAY DISCOVERY: No array found in object!');
            return null;
          };

          const detectedArray = discoverArray(parsedData);
          if (!detectedArray) {
            console.error('ERROR: No plot sequence discovered');
            console.error('Parsed data:', JSON.stringify(parsedData, null, 2));
            throw new Error('No plot sequence discovered in AI response.');
          }

          console.log('SUCCESS: Plot map extracted with', detectedArray.length, 'scenes');
          console.log('=== PLOT MAPPING DEBUG END ===');

          setPlotMap(detectedArray);

          toast({
            title: "Narrative Architected",
          });

          setCurrentStep('settings');
        } catch (parseError) {
          console.error('Core parsing error:', parseError);
          console.error('Full response content for debugging:', response.content);

          // === FALLBACK: Generate synthetic plot map from synopsis text ===
          console.warn('FALLBACK: AI returned non-JSON. Generating synthetic plot map from synopsis...');
          const numScenes = plotSettings.scenesNumber || 15;
          const synopsisText = synopsis.content || '';

          // Split synopsis into chunks to create scene descriptions
          const sentences = synopsisText
            .replace(/([.!?])\s+/g, '$1|||')
            .split('|||')
            .filter((s: string) => s.trim().length > 10);

          const syntheticMap = [];
          const scenesPerChunk = Math.max(1, Math.ceil(sentences.length / numScenes));

          for (let i = 0; i < numScenes; i++) {
            const chunkStart = i * scenesPerChunk;
            const chunkEnd = Math.min(chunkStart + scenesPerChunk, sentences.length);
            const chunkSentences = sentences.slice(chunkStart, chunkEnd);
            const storyline = chunkSentences.length > 0
              ? chunkSentences.join(' ').trim()
              : `Scene ${i + 1} continues the story`;

            const actLabel = i < numScenes * 0.25 ? 'Setup'
              : i < numScenes * 0.5 ? 'Rising Action'
                : i < numScenes * 0.75 ? 'Climax'
                  : 'Resolution';

            syntheticMap.push({
              scene_number: i + 1,
              title: `${actLabel} - Scene ${i + 1}`,
              goal: `${actLabel}: Advance the narrative`,
              storyline: storyline,
              causal_links: i > 0 ? [i] : [],
              character_states: {}
            });
          }

          console.log('FALLBACK: Generated synthetic plot map with', syntheticMap.length, 'scenes');
          setPlotMap(syntheticMap);

          toast({
            title: "Plot Map Generated (Fallback)",
            description: "AI didn't return structured data, so a basic plot map was created from your synopsis. You can proceed with generation.",
          });

          setCurrentStep('settings');
        }
      } else {
        console.error('Invalid response structure from edge function:', response);
        throw new Error('Failed to get a valid response from the generation engine.');
      }
    } catch (error) {
      console.error('Top-level Plot Mapping Error:', error);
      toast({
        title: "Plot Mapping Failed",
        description: error instanceof Error ? error.message : "Falling back to standard generation.",
        variant: "destructive"
      });
      setCurrentStep('settings'); // Fallback
    } finally {
      setIsGeneratingPlotMap(false);
    }
  };

  const generateSceneBatch = async (
    startScene: number,
    endScene: number,
    totalScenes: number,
    scriptId: string,
    episodeInfo?: { number: number; title: string; beat: string },
    previousBatchTail: string = "",
    rollingContext: string = "",
    currentPlotMap: SceneMap[] = plotMap,
    alreadyIntroduced: string[] = []
  ) => {
    console.log(`=== Generating Batch (Scenes ${startScene}-${endScene} of ${totalScenes}) ===`);

    // Get current scenes from plot map for this batch
    const batchScenePlans = currentPlotMap.filter(s => s.scene_number >= startScene && s.scene_number <= endScene);

    // Get film industry context if available
    const industryContext = initialData?.filmIndustry ? getIndustryAIPromptContext(initialData.filmIndustry) : '';
    const scriptTypeText = initialData?.scriptType ? ` (${initialData.scriptType})` : '';

    // Build the scene generation prompt
    const episodeText = episodeInfo ? ` (Episode ${episodeInfo.number}: ${episodeInfo.title})` : '';
    
    const isSeriesCheck = initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES;
    const isNollywoodCheck = initialData?.filmIndustry === 'Nollywood';

    const dialogueRule = isSeriesCheck 
      ? `\n\nDIALOGUE RULE: Keep dialogues extremely concise, light, and straight to the point. Avoid heavy, draggy, or overly dramatic monologues. Characters must speak realistically with minimal words.` 
      : '';

    const nollywoodConstraints = isNollywoodCheck 
      ? `\n\nNOLLYWOOD CASTING RULE: Never have more than 3 active speaking characters in any single scene.\n\nNOLLYWOOD LOCATION RULE: Keep the number of unique locations to an absolute minimum. Reuse the same 2-3 primary locations throughout the script whenever possible.` 
      : '';

    // Format the batch plans for the prompt
    const plansContext = batchScenePlans.length > 0
      ? batchScenePlans.map(p => `SCENE ${p.scene_number} GOAL: ${p.goal}\nSCENE ${p.scene_number} STORYLINE: ${p.storyline}`).join('\n\n')
      : episodeInfo
        ? `[No structured scene plan available for this batch. Use the episode story beat to guide these scenes: ${episodeInfo.storyBeat || episodeInfo.beat || ''}]`
        : `Full Treatment: ${selectedSynopsis?.content}`;

    const episodeSpecificInstructions = episodeInfo 
      ? `\n\n=== THIS IS EPISODE ${episodeInfo.number}: ${episodeInfo.title} ===\nYou are ONLY writing scenes for this episode. Do NOT write scenes from any other episode.\nEPISODE STORY BEAT: ${episodeInfo.storyBeat || episodeInfo.beat || ''}\nSTRICTLY FOLLOW the Scene Plans below. Every scene you write MUST correspond to one of the listed scene plans for this episode.`
      : '';

    const scenePrompt = startScene === 1 ?
      `Generate SCENES ${startScene} through ${endScene} (${endScene - startScene + 1} scenes total) using these structural tags: [SCENE], [ACTION], [CHAR], [DIALOGUE], [PAREN], [TRANS].

MANDATORY SCENE COUNT: You MUST write EXACTLY ${endScene - startScene + 1} scenes in this response — no more, no less. Each scene MUST begin with a [SCENE] tag. Do NOT stop early. Do NOT combine multiple scenes into one.

STRICT: Output ONLY the tagged script content in plain text. DO NOT use markdown, asterisks, or bold text. No labels, no preamble. Jump directly to the first [SCENE].

Title: "${initialData?.title}${episodeText}"${episodeSpecificInstructions}

OPENING SCENE RULE: The first scene MUST be a strong, engaging, action-packed and/or hilarious scene that hooks the audience immediately. NEVER a quiet opening.

CHARACTER RULE: Write a character's name in ALL CAPS ONLY the very first time they appear in the ENTIRE script. NEVER add age, description, or any text in brackets after a character's name — not ever, not even on introduction. On all subsequent appearances in ANY episode or scene, write their name normally (not ALL CAPS).${alreadyIntroduced.length > 0 ? `

ALREADY INTRODUCED CHARACTERS (DO NOT re-introduce these with ALL CAPS or brackets — write their names normally every time): ${alreadyIntroduced.join(', ')}` : ''}${dialogueRule}${nollywoodConstraints}

NO HYPHENS RULE — ABSOLUTE: NEVER use hyphens or dashes (-, –, —) anywhere. Use "..." for pauses, commas for breaks, and rewrite compound words without hyphens.

SCENE PLANS (Adapt these to fit the episode beat if applicable):
${plansContext}

At the end of your full response, include a [SUMMARY] tag followed by a 2-sentence summary of the key events across all scenes generated.
` :

      `Generate SCENES ${startScene} through ${endScene} of ${totalScenes} (${endScene - startScene + 1} scenes).

MANDATORY SCENE COUNT: You MUST write EXACTLY ${endScene - startScene + 1} scenes in this response — no more, no less. Each scene MUST begin with a [SCENE] tag. Do NOT stop early. Do NOT combine multiple scenes into one.

STRICT: Output ONLY the tagged script content in plain text. DO NOT use markdown, asterisks, or bold text. Use ONLY [SCENE], [ACTION], [CHAR], [DIALOGUE], [PAREN], [TRANS] tags. Do not explain anything.

Title: "${initialData?.title}${episodeText}"${episodeSpecificInstructions}

STORY SO FAR (Memory):
${rollingContext || "N/A"}

Maintain continuity from exact previous scene tail:
${previousBatchTail || "N/A"}

CHARACTER RULE: Write a character's name in ALL CAPS ONLY the very first time they appear in the ENTIRE script. NEVER add age, description, or any text in brackets after a character's name — not ever, not even on introduction. On all subsequent appearances in ANY episode or scene, write their name normally (not ALL CAPS).${alreadyIntroduced.length > 0 ? `

ALREADY INTRODUCED CHARACTERS (DO NOT re-introduce these with ALL CAPS or brackets — write their names normally every time): ${alreadyIntroduced.join(', ')}` : ''}${dialogueRule}${nollywoodConstraints}

NO HYPHENS RULE — ABSOLUTE: NEVER use hyphens or dashes (-, –, —) anywhere. Use "..." for pauses, commas for breaks, and rewrite compound words without hyphens.

SCENE PLANS (Adapt these to fit the episode beat if applicable):
${plansContext}

At the end of your response, include a [SUMMARY] tag followed by a 2-sentence summary of what happened across all scenes in this batch.`;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        console.log(`Making request to generate-script-content (Attempt ${retryCount + 1}/${maxRetries + 1})...`);

        // Get current user to ensure authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Authentication error:', userError);
          throw new Error('Authentication required. Please sign in.');
        }

        console.log('User authenticated:', user.id);

        // Dynamic settings based on industry
        const isNollywood = !initialData?.filmIndustry || initialData.filmIndustry === 'Nollywood';
        const region = plotSettings.setting || (isNollywood ? 'Lagos' : 'International');

        // Pass character context explicitly
        const characterSection = selectedSynopsis?.content.match(/\*\*DETAILED CHARACTER PROFILES:\*\*[\s\S]*?(?=\*\*SETTING|$)/i)?.[0] || "";
        const contextInjection = episodeInfo 
          ? `\n\nOfficial Characters:\n${characterSection}\n\n=== SERIES BIBLE — REFERENCE ONLY ===\nYou MUST use this to maintain continuity and understand character arcs. However, you are WRITING EPISODE ${episodeInfo.number} ONLY. Any scene that belongs to a different episode is STRICTLY FORBIDDEN.\n\nFULL SEASON STORYLINE:\n${selectedSynopsis?.content}\n=== END SERIES BIBLE ===`
          : `\n\nOfficial Characters:\n${characterSection}\n\nFull Plot Context:\n${selectedSynopsis?.content}`;

        // Determine prompt body
        const body = {
          promptType: 'dialogue',
          genre: initialData?.genre || 'DRAMA',
          subGenres: [],
          language: plotSettings.language || 'ENGLISH',
          setting: { region: region },
          seedPlot: `Create a full screenplay script scene: ${scenePrompt}${contextInjection}`,
          culturalAuthenticity: 95,
          includeTraditional: isNollywood,
          currentBatchPlans: batchScenePlans,
          rollingContext: rollingContext
        };

        // Make the request with proper structure and authentication
        const { data: response, error } = await supabase.functions.invoke('generate-plot-content', {
          body
        });

        console.log(`Response received for scenes ${startScene}-${endScene}:`, {
          success: response?.success,
          hasError: !!error,
          error: error,
          response: response
        });

        if (error) {
          console.error(`Edge function error for scenes ${startScene}-${endScene}:`, error);

          // Log specific error details if available
          if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            // @ts-ignore - Some errors might have additional context
            if (error.context) console.error('Error context:', error.context);
          }

          // Enhanced error handling with specific error types
          if (error.message?.includes('Failed to send a request to the Edge Function')) {
            throw new Error('Network error: Could not connect to AI service. Please check your internet connection and try again.');
          } else if (error.message?.includes('auth')) {
            throw new Error('Authentication failed. Please sign in and try again.');
          } else {
            // Try to extract more details from the error message if it's JSON-like
            throw new Error(`Service error: ${error.message || 'Unknown error occurred'}`);
          }
        }

        if (!response) {
          console.error(`No response received for scenes ${startScene}-${endScene}`);
          throw new Error('No response received from script generation service.');
        }

        if (!response.success) {
          console.error(`Script generation failed for scenes ${startScene}-${endScene} - Full Response:`, response);

          // Show specific error from the edge function
          const errorMessage = response.error || 'Script generation failed';
          const errorType = response.errorType || 'unknown';
          const debugInfo = response.debug ? ` (Debug: ${response.debug})` : '';

          throw new Error(`${errorType.toUpperCase()}: ${errorMessage}${debugInfo}`);
        }

        // Check for cache hit and show notification
        if (response.cache_info?.status === 'cache_hit') {
          toast({
            title: "⚡ Instant Scene",
            description: "Scene delivered from cache",
            duration: 2000,
          });
        }

        if (!response.content) {
          console.error(`No content in response for scenes ${startScene}-${endScene}:`, response);
          throw new Error('No content received from script generation');
        }

        console.log(`Successfully generated scenes ${startScene}-${endScene}, content length: ${response.content.length}`);
        return response.content;

      } catch (error) {
        console.error(`Error in generateSceneBatch (Attempt ${retryCount + 1}):`, error);

        retryCount++;

        if (retryCount > maxRetries) {
          // Provide more specific error messages on final failure
          if (error instanceof Error) {
            if (error.message.includes('auth')) {
              throw new Error('Authentication failed. Please sign in and try again.');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
              throw new Error('Network error. Please check your connection and try again.');
            } else {
              throw new Error(`Scene generation failed after ${maxRetries} retries: ${error.message}`);
            }
          } else {
            throw new Error('Unknown error occurred during scene generation');
          }
        }

        // Wait before retrying (exponential backoff: 2s, 4s, 8s)
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleGenerateScript = async () => {
    // Prevent double-clicks using synchronous ref check
    if (isGeneratingRef.current || isGeneratingScript) return;
    
    if (!selectedSynopsis || !plotSettings.period || !plotSettings.setting || !plotSettings.pace) {
      toast({
        title: "Missing Information",
        description: "Please complete all settings before generating the script.",
        variant: "destructive"
      });
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a script.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Lock immediately
    isGeneratingRef.current = true;
    setIsGeneratingScript(true);
    setCurrentStep('generating');

    // Deduct AI credits: 2 per scene to be generated
    const scenesCount = plotSettings.scenesNumber || 15;
    const creditsNeeded = scenesCount * 2;
    const creditResult = await deductAICredits(
      creditsNeeded,
      'script_generation',
      `Generated ${scenesCount}-scene script: "${initialData?.title}"`
    );
    if (!creditResult.success) {
      toast({
        title: "Insufficient AI Credits",
        description: creditResult.message || `You need ${creditsNeeded} credits to generate this script.`,
        variant: "destructive"
      });
      isGeneratingRef.current = false;
      setIsGeneratingScript(false);
      setCurrentStep('settings');
      return;
    }

    const isSeries = initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES;

    // Robust episode array creation with multiple fallbacks
    let episodesToGenerate;
    if (isSeries && initialData?.seasonPlan) {
      const { episodeCount, episodes, seasonTheme } = initialData.seasonPlan;

      // Use existing episodes if available and valid
      if (episodes && episodes.length > 0) {
        // Enforce uniqueness by episodeNumber to prevent duplicate generations
        const uniqueEpisodes: any[] = [];
        const seen = new Set();
        for (const ep of episodes) {
            if (!seen.has(ep.episodeNumber)) {
                seen.add(ep.episodeNumber);
                uniqueEpisodes.push(ep);
            }
        }
        episodesToGenerate = uniqueEpisodes;
      }
      // Otherwise, generate stubs based on episodeCount
      else if (episodeCount && episodeCount > 0) {
        episodesToGenerate = Array.from({ length: episodeCount }, (_, i) => ({
          episodeNumber: i + 1,
          title: i === 0 ? 'Pilot' : `Episode ${i + 1}`,
          storyBeat: seasonTheme || 'Episode story'
        }));
      }
      // Final fallback: single episode
      else {
        episodesToGenerate = [{ episodeNumber: 1, title: 'Pilot', storyBeat: seasonTheme || '' }];
      }
    } else {
      // Not a series - single script
      episodesToGenerate = [{ episodeNumber: 1, title: '', storyBeat: '' }];
    }

    setTotalEpisodes(episodesToGenerate.length);
    setIsMultiEpisode(isSeries && episodesToGenerate.length > 1);

    try {
      // Track characters introduced across ALL episodes so they are never re-introduced
      const introducedCharactersAcrossScript = new Set<string>();

      for (let i = 0; i < episodesToGenerate.length; i++) {
        const currentEpisode = episodesToGenerate[i];
        setCurrentEpisodeIndex(i + 1);
        setGenerationProgress(0);

        console.log(`\n=== Generating Episode ${i + 1} of ${episodesToGenerate.length} ===`);

        // Create the script in database
        const newScriptId = uuid();
        const episodeTitleSuffix = isSeries ? ` - S01E${currentEpisode.episodeNumber}${currentEpisode.title ? `: ${currentEpisode.title}` : ''}` : '';
        const scriptTitle = `${initialData?.title || "Untitled Script"}${episodeTitleSuffix}`;

        // Generate Episode-Specific Plot Map for TV Series
        // CRITICAL: Never fall back to the global plotMap for series — it covers the whole season
        let episodePlotMap: any[] = [];
        if (isSeries) {
          console.log(`Generating unique Plot Map for Episode ${currentEpisode.episodeNumber}: "${currentEpisode.title}"...`);
          try {
            const { data: pmResponse } = await supabase.functions.invoke('generate-plot-content', {
              body: {
                promptType: 'plot_map',
                genre: initialData?.genre,
                seedPlot: `CRITICAL INSTRUCTION: You are generating a ${plotSettings.scenesNumber || 15}-scene plot map for EPISODE ${currentEpisode.episodeNumber} titled "${currentEpisode.title}" ONLY.\n\nEPISODE ${currentEpisode.episodeNumber} STORY BEAT:\n${currentEpisode.storyBeat}\n\n=== SERIES BIBLE (FOR CONTINUITY CONTEXT ONLY — DO NOT WRITE SCENES FROM OTHER EPISODES) ===\n${selectedSynopsis?.content}\n\nGenerate EXACTLY ${plotSettings.scenesNumber || 15} scenes strictly for Episode ${currentEpisode.episodeNumber}.`,
                scenesNumber: plotSettings.scenesNumber || 15,
                tone: plotSettings.tone,
                language: plotSettings.language,
                bypassCache: true
              }
            });

            if (pmResponse?.success && pmResponse?.content) {
              // Robust parsing — same logic as generatePlotMap()
              let jsonStr = pmResponse.content.replace(/```json|```/gi, '').trim();
              const arrayStart = jsonStr.indexOf('[');
              const objStart = jsonStr.indexOf('{');
              let startIdx = -1;
              if (arrayStart !== -1 && objStart !== -1) startIdx = Math.min(arrayStart, objStart);
              else if (arrayStart !== -1) startIdx = arrayStart;
              else if (objStart !== -1) startIdx = objStart;
              if (startIdx !== -1) {
                const arrayEnd = jsonStr.lastIndexOf(']');
                const objEnd = jsonStr.lastIndexOf('}');
                const endIdx = Math.max(arrayEnd, objEnd);
                if (endIdx > startIdx) jsonStr = jsonStr.substring(startIdx, endIdx + 1);
              }
              try {
                const parsedData = JSON.parse(jsonStr);
                let discovered: any[] | null = null;
                if (Array.isArray(parsedData)) discovered = parsedData;
                else if (parsedData && typeof parsedData === 'object') {
                  for (const key of ['scenes', 'plot', 'scene_list']) {
                    if (Array.isArray(parsedData[key])) { discovered = parsedData[key]; break; }
                  }
                  if (!discovered) {
                    for (const key of Object.keys(parsedData)) {
                      if (Array.isArray(parsedData[key])) { discovered = parsedData[key]; break; }
                    }
                  }
                }
                if (discovered && discovered.length > 0) {
                  episodePlotMap = discovered;
                  console.log(`Episode ${currentEpisode.episodeNumber} plot map: ${episodePlotMap.length} scenes`);
                }
              } catch (parseErr) {
                console.warn('Episode plot map JSON parse failed', parseErr);
              }
            }
          } catch (e) {
            console.error('Failed to generate episode plot map', e);
          }
        } else {
          // Single film — use the global plot map generated earlier
          episodePlotMap = plotMap;
        }

        const { error: scriptError } = await supabase.from('scripts').insert({
          id: newScriptId,
          title: scriptTitle,
          user_id: user.id,
          genre: initialData?.genre,
          language: plotSettings.language,
          script_type: initialData?.scriptType,
          film_industry: initialData?.filmIndustry,
          plot_map: episodePlotMap // CRITICAL FIX: Save the specific episode plot map
        });

        if (scriptError) throw new Error(`Failed to create script: ${scriptError.message}`);

        // Use the user's preferred scene count for the episode
        const episodeTotalScenes = plotSettings.scenesNumber || 15;
        
        // Generate content — 40 scenes per request
        const scenesPerBatch = 40;
        
        // Initialize story state for coherence tracking
        const allScenes = ['FADE IN:\n\n'];
        let previousBatchTail = "";
        let rollingSummaries: string[] = [];

        // Helper: extract character names introduced in a batch (ALL CAPS words in [ACTION] lines)
        const extractIntroducedChars = (text: string): string[] => {
          const names: string[] = [];
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('[ACTION]')) {
              // Match ALL CAPS words (2+ letters) that may be followed by optional (digits)
              const matches = line.matchAll(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\s*(?:\(\d+\))?/g);
              for (const m of matches) {
                const name = m[1].trim();
                // Filter out common uppercase non-name words
                const skip = new Set(['INT','EXT','FADE','CUT','SMASH','DISSOLVE','THE','AND','BUT','FROM','INTO','ONTO','OVER','WITH','THEN','WHEN','BACK']);
                if (!skip.has(name) && name.length >= 2) names.push(name);
              }
            }
          }
          return [...new Set(names)];
        };

        let currentSceneGenerated = 0;
        let batchCounter = 0;

        while (currentSceneGenerated < episodeTotalScenes) {
          batchCounter++;
          setCurrentBatch(batchCounter);
          
          const startScene = currentSceneGenerated + 1;
          const endScene = Math.min(startScene + scenesPerBatch - 1, episodeTotalScenes);

          // Generate scene, passing already-introduced characters to prevent re-introductions
          const combinedResponse = await generateSceneBatch(
            startScene,
            endScene,
            episodeTotalScenes,
            newScriptId,
            isSeries ? currentEpisode : undefined,
            previousBatchTail,
            rollingSummaries.join(' '),
            episodePlotMap,
            [...introducedCharactersAcrossScript]
          );

          // Extract content and summary
          let batchContent = combinedResponse;
          let sceneSummary = "";

          const summaryIdx = combinedResponse.indexOf('[SUMMARY]');
          if (summaryIdx !== -1) {
            batchContent = combinedResponse.substring(0, summaryIdx).trim();
            sceneSummary = combinedResponse.substring(summaryIdx + 9).trim();
            if (sceneSummary) rollingSummaries.push(`- ${sceneSummary}`);
          }

          allScenes.push(batchContent);

          // Dynamically count how many scenes the AI ACTUALLY generated in this batch
          const generatedScenesCount = (batchContent.match(/\[SCENE\]/g) || []).length;
          // Fallback just in case AI didn't use [SCENE] tags, to prevent infinite loop
          const actualGenerated = generatedScenesCount > 0 ? generatedScenesCount : (endScene - startScene + 1);
          
          currentSceneGenerated += actualGenerated;

          // Track introduced characters so future batches/episodes don't re-introduce them
          const newlyIntroduced = extractIntroducedChars(batchContent);
          newlyIntroduced.forEach(name => introducedCharactersAcrossScript.add(name));

          // Extract the tail of the current batch for the next one (last ~800 characters)
          previousBatchTail = batchContent.length > 800
            ? batchContent.substring(batchContent.length - 800)
            : batchContent;

          setGenerationProgress(Math.min((currentSceneGenerated / episodeTotalScenes) * 100, 100));

          if (currentSceneGenerated < episodeTotalScenes) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        allScenes.push('\n\nFADE OUT.\n\nTHE END');
        const fullScript = allScenes.join('\n\n');

        // Save elements
        const elementsWithScriptId = parseScriptElements(fullScript).map(element => ({
          ...element,
          script_id: newScriptId
        }));

        const INSERT_CHUNK_SIZE = 500;
        for (let j = 0; j < elementsWithScriptId.length; j += INSERT_CHUNK_SIZE) {
          const chunk = elementsWithScriptId.slice(j, j + INSERT_CHUNK_SIZE);
          const { error: elementsError } = await supabase.from('script_elements').insert(chunk);
          if (elementsError) throw new Error(`Failed to save script content: ${elementsError.message}`);
        }

        console.log(`Episode ${i + 1} insertion completed.`);

        // CRITICAL FIX: Explicitly enforce order using atomic RPC
        // This guarantees that the database positions match the parsed narrative order exactly,
        // overriding any potential insertion race conditions.
        const allElementIds = elementsWithScriptId.map(e => e.id);
        const { error: reorderError } = await supabase.rpc('reorder_script_elements_atomic' as any, {
          p_script_id: newScriptId,
          p_element_ids: allElementIds
        });

        if (reorderError) {
          console.error("Failed to enforce final element order:", reorderError);
          // Don't fail the whole process, but warn
          toast({
            title: "Warning",
            description: "Script created but order verification failed. Please check the script in the editor.",
            variant: "destructive"
          });
        } else {
          console.log("Verified and enforced sequential element order.");
        }
      }

      toast({
        title: isSeries ? "Full Season Generated!" : "Professional Screenplay Generated!",
        description: isSeries
          ? `All ${episodesToGenerate.length} episodes have been created in your dashboard.`
          : `Your ${plotSettings.scenesNumber}-scene screenplay has been created successfully.`,
      });

      // Navigate based on type
      if (isSeries && episodesToGenerate.length > 1) {
        navigate('/dashboard');
      } else {
        // Find the last created ID if it was just one
        // (Actually it's better to just go to dashboard for series regardless)
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('=== Script Generation Failed ===', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setCurrentStep('settings');
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingScript(false);
    }
  };

  const handleSynopsisSelect = (synopsis: SynopsisOption) => {
    setSelectedSynopsis(synopsis);
    setPlotSettings(prev => ({ ...prev, tone: synopsis.tone }));
  };

  const handleContinueToSettings = () => {
    if (!selectedSynopsis) {
      toast({
        title: "Selection Required",
        description: "Please select a synopsis to continue.",
        variant: "destructive"
      });
      return;
    }
    generatePlotMap(selectedSynopsis);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!initialData && currentStep === 'synopsis') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Plot Data Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please start from the dashboard by creating a new script with AI generation.
            </p>
            <Button onClick={handleBackToDashboard}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Professional AI Screenplay Generator</h1>
          {initialData && (
            <p className="text-muted-foreground mt-1">
              Creating "{initialData.title}" - {initialData.genre}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleBackToDashboard} className="shrink-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-y-4 gap-x-2 sm:gap-x-4 mb-8 text-sm sm:text-base">
        <div className={`flex items-center space-x-2 ${currentStep === 'synopsis' ? 'text-primary' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'synopsis' ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white'}`}>
            {currentStep !== 'synopsis' ? <CheckCircle className="h-4 w-4" /> : '1'}
          </div>
          <span>Choose Treatment</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${currentStep === 'plotting' ? 'text-primary' : (currentStep === 'settings' || currentStep === 'generating') ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'plotting' ? 'bg-primary text-primary-foreground' : (currentStep === 'settings' || currentStep === 'generating') ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            {(currentStep === 'settings' || currentStep === 'generating') ? <CheckCircle className="h-4 w-4" /> : '2'}
          </div>
          <span>Architect Plot</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${currentStep === 'settings' ? 'text-primary' : currentStep === 'generating' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'settings' ? 'bg-primary text-primary-foreground' : currentStep === 'generating' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            {currentStep === 'generating' ? <CheckCircle className="h-4 w-4" /> : '3'}
          </div>
          <span>Settings</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${currentStep === 'generating' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'generating' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            4
          </div>
          <span>Generate</span>
        </div>
      </div>

      {/* Step 1: Synopsis Selection */}
      {currentStep === 'synopsis' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Professional Story Treatment</CardTitle>
              <p className="text-muted-foreground">
                Select the comprehensive treatment that best matches your vision. Each includes detailed character profiles, plot structure, cultural elements, and thematic analysis.
              </p>
            </CardHeader>
            <CardContent>
              {isGeneratingSynopses ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">Generating Comprehensive Professional Treatments</h3>
                  <p className="text-muted-foreground">Creating detailed story treatments with character profiles, cultural elements, and industry-standard structure...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {synopsisOptions.map((synopsis) => (
                    <Card
                      key={synopsis.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${selectedSynopsis?.id === synopsis.id ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                      onClick={() => handleSynopsisSelect(synopsis)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{synopsis.title}</CardTitle>
                            <Badge variant="secondary" className="mt-2">{synopsis.tone}</Badge>
                          </div>
                          {selectedSynopsis?.id === synopsis.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                          {synopsis.content}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {synopsisOptions.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <Label htmlFor="custom-instruction" className="text-base font-semibold mb-2 block">
                        Refine Plan with AI
                      </Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Want to tweak this plan? Give the AI specific instructions (e.g. "Focus more on the romantic subplot" or "Make episode 3 more action-packed").
                      </p>
                      <div className="flex flex-col gap-3">
                        <Textarea 
                          id="custom-instruction"
                          placeholder="Type your custom instructions here..."
                          value={customSynopsisInstruction}
                          onChange={(e) => setCustomSynopsisInstruction(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button 
                          onClick={() => generateSynopsisOptions(initialData!, customSynopsisInstruction)}
                          variant="secondary"
                          className="self-end"
                          disabled={!customSynopsisInstruction.trim() || isGeneratingSynopses}
                        >
                          Regenerate with Instructions
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedSynopsis && (
                    <div className="flex justify-end mt-6">
                      <Button onClick={handleContinueToSettings} className="bg-primary">
                        Continue to Production Settings
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Plot Mapping */}
      {currentStep === 'plotting' && (
        <div className="text-center py-20 space-y-6">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Narrative Architecting</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Breaking down your story into granular scene goals and establishing causal relationships to ensure a coherent screenplay...
            </p>
          </div>
        </div>
      )}
      {currentStep === 'settings' && (
        <div className="space-y-6">
          {(() => {
            const options = getOptionsForIndustry(initialData?.filmIndustry);
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Configure Your Professional Screenplay</CardTitle>
                  <p className="text-muted-foreground">
                    Set the production details for your industry-standard screenplay
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Tone</Label>
                      <Select value={plotSettings.tone} onValueChange={(value) => setPlotSettings({ ...plotSettings, tone: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.tones.map((tone) => (
                            <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Time Period</Label>
                      <Select value={plotSettings.period} onValueChange={(value) => setPlotSettings({ ...plotSettings, period: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.periods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Setting</Label>
                      <Select value={plotSettings.setting} onValueChange={(value) => setPlotSettings({ ...plotSettings, setting: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select setting" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.settings.map((setting) => (
                            <SelectItem key={setting} value={setting}>{setting}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Pace</Label>
                      <Select value={plotSettings.pace} onValueChange={(value) => setPlotSettings({ ...plotSettings, pace: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pace" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.paces.map((pace) => (
                            <SelectItem key={pace} value={pace}>{pace}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Language</Label>
                      <Select value={plotSettings.language} onValueChange={(value) => setPlotSettings({ ...plotSettings, language: value as Language })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>
                        {(initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES) 
                          ? "Scenes Per Episode (Max: 24)" 
                          : "Number of Scenes (Range: 5-150)"}
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setPlotSettings({ ...plotSettings, scenesNumber: Math.max(5, plotSettings.scenesNumber - 1) })}
                          disabled={plotSettings.scenesNumber <= 5}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="5"
                          max={(initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES) ? 24 : 150}
                          value={plotSettings.scenesNumber}
                          onChange={(e) => {
                            let value = parseInt(e.target.value) || 13;
                            const maxVal = (initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES) ? 24 : 150;
                            if (value > maxVal) value = maxVal;
                            setPlotSettings({ ...plotSettings, scenesNumber: value });
                          }}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const maxVal = (initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES) ? 24 : 150;
                            setPlotSettings({ ...plotSettings, scenesNumber: Math.min(maxVal, plotSettings.scenesNumber + 1) });
                          }}
                          disabled={plotSettings.scenesNumber >= ((initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES) ? 24 : 150)}
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: 5-{(initialData?.scriptType === ScriptType.TV_SERIES || initialData?.scriptType === ScriptType.WEB_SERIES) ? 24 : 150} scenes • Current: {plotSettings.scenesNumber} scenes
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between mt-6">
                    <Button variant="outline" className="w-full sm:w-auto h-auto py-2 whitespace-normal" onClick={() => setCurrentStep('synopsis')}>
                      <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                      <span className="text-left">Back to Treatment</span>
                    </Button>
                    <Button onClick={handleGenerateScript} className="bg-primary w-full sm:w-auto h-auto py-2 whitespace-normal">
                      <Sparkles className="mr-2 h-4 w-4 shrink-0" />
                      <span className="text-left">Generate Professional Screenplay</span>
                    </Button>
                  </div>
                </CardContent>
              </Card >
            );
          })()}
        </div >
      )
      }

      {/* Step 3: Generating Script */}
      {
        currentStep === 'generating' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isMultiEpisode
                    ? "Generating Full Season Season S01"
                    : "Generating Professional Industry-Standard Screenplay"
                  }
                </CardTitle>
                <p className="text-muted-foreground">
                  {isMultiEpisode
                    ? "Creating each episode with distinct plot beats and formatting each for production readiness"
                    : "Creating your full-length screenplay with proper formatting in batches for maximum detail"
                  }
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {isMultiEpisode
                      ? `Generating Episode ${currentEpisodeIndex} of ${totalEpisodes}`
                      : "Generating Professional Screenplay"
                    }
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Batch {currentBatch} of {totalBatches} • {isMultiEpisode ? "Episode scenes in progress" : "Processing scenes with full dialogue and action"}
                  </p>

                  <div className="max-w-md mx-auto mb-6">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Total Progress</span>
                      <span>{isMultiEpisode ? Math.round(((currentEpisodeIndex - 1) / totalEpisodes) * 100 + (generationProgress / totalEpisodes)) : Math.round(generationProgress)}%</span>
                    </div>
                    <Progress
                      value={isMultiEpisode ? ((currentEpisodeIndex - 1) / totalEpisodes) * 100 + (generationProgress / totalEpisodes) : generationProgress}
                      className="h-2 mb-4"
                    />

                    {isMultiEpisode && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Episode {currentEpisodeIndex} Content</span>
                          <span>{Math.round(generationProgress)}%</span>
                        </div>
                        <Progress value={generationProgress} className="h-1 bg-muted/50" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Creating full scenes with detailed dialogue and action</p>
                    <p>✓ Applying professional screenplay formatting standards</p>
                    <p>✓ Developing authentic character interactions</p>
                    <p>✓ Building rich visual storytelling elements</p>
                    <p>✓ Ensuring proper scene structure and pacing</p>
                    <p>✓ Hallucination-aware scene refinement</p>
                    <p>✓ Implementing intelligent element parsing</p>
                    <p>✓ Processing in batches for maximum detail</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }
    </div >
  );
}
