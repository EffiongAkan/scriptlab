import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, keepalive',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

//=============================================================================
// Cache & Cost Utilities
//=============================================================================

async function generateCacheKey(provider: string, model: string, prompt: string, systemPrompt: string): Promise<string> {
  const normalized = JSON.stringify({ provider: provider.toLowerCase(), model, prompt: prompt.trim(), system: systemPrompt.trim() });
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function estimateTokens(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 0.75);
}

const MODEL_PRICING: Record<string, { input: number, output: number }> = {
  'claude-3-7-sonnet-20250219': { input: 0.003, output: 0.015 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'deepseek-chat': { input: 0.00014, output: 0.00028 }
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0.003, output: 0.015 };
  return (inputTokens / 1000 * pricing.input) + (outputTokens / 1000 * pricing.output);
}

//=============================================================================
// Main Handler
//=============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error(`Auth failed: ${userError?.message}`);

    const requestBody = await req.json();
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch AI settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('key, value');

    if (settingsError) throw new Error(`DB error: ${settingsError.message}`);

    const getSetting = (key: string) => {
      const setting = settings?.find(s => s.key === key);
      if (!setting) return null;
      let val = setting.value;
      if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
      if (typeof val === 'string') val = val.replace(/^"+|"+$/g, '').replace(/\\"/g, '"');
      return val;
    };

    const activeProvider = getSetting('active_ai_provider') || 'deepseek';
    const activeModel = getSetting('active_ai_model') || 'deepseek-chat';

    const { seedPlot, genre, scriptId, customSystemPrompt, promptType, characters, currentBatchPlans, scenesNumber, tone, language } = requestBody;

    // Build comprehensive system prompt (Restored October 2025 Logic)
    let systemPrompt = customSystemPrompt || "You are an expert screenwriter and storyteller specializing in Nigerian and African cinema. You create engaging, culturally authentic content that resonates with African audiences while maintaining universal appeal. CRITICAL: NO pidgin dialogues unless explicitly selected or required by the plot. NO market scenes. NO use of juju/magic. NO Nigerian proverbs.";

    const isPlotMapGeneration = promptType === 'plot_map';
    const isScriptGeneration = promptType === 'dialogue' || (seedPlot && seedPlot.toLowerCase().includes("create a full professional screenplay"));

    if (isPlotMapGeneration) {
      // ... (Keep existing plot map generation prompt)
    } else if (isScriptGeneration) {
      systemPrompt += ` You are a storytelling engine. You MUST start EVERY line with one of these tags:
[SCENE]
[ACTION]
[CHAR]
[DIALOGUE]
[PAREN]
[TRANS]

STRICT RULES:
1. Every line of dialogue MUST be preceded by a [CHAR] line.
2. Each scene MUST start with a [SCENE] tag.
3. CRITICAL: Never output placeholder text. Output ONLY the actual story content.
4. Jump directly to the first [SCENE] tag. No preamble.

${currentBatchPlans && currentBatchPlans.length > 0 ? `CURRENT SCENE PLAN:
${currentBatchPlans.map((p: any) => `
SCENE ${p.scene_number} [${p.title}]:
- Goal: ${p.goal}
- Storyline: ${p.storyline}
- Character States: ${JSON.stringify(p.character_states)}
- Causal Links: ${p.causal_links?.join(', ') || 'N/A'}`).join('\n\n')}

${requestBody.rollingContext ? `STORY MEMORY (Preceding Action):
${requestBody.rollingContext}` : ''}

IMPORTANT: You are generating EXACTLY ONE SCENE. Do not summarize. Write the full scene with dialogue. 
At the end of your response, after the script content, add a [SUMMARY] tag and a 1-sentence recap for continuity.` : ''}

SCENE LENGTH: Each scene should be substantial with rich dialogue, but action lines MUST be light and concise. DO NOT write heavy, bulky, or overly detailed action descriptions.

CRITICAL FORMATTING RULES:
1. CHARACTER INTRODUCTIONS: The first time a character appears in an action line, their name MUST be in ALL CAPS.
2. SCENE HEADINGS: [SCENE] must ONLY contain INT. or EXT., followed by location and time. NEVER include scene numbers, episode titles, or words like "SCENE 1:". Example: [SCENE] EXT. COMPOUND - NIGHT
3. PARENTHETICALS: [PAREN] must ALWAYS contain the actual parentheses characters '(' and ')'. NEVER omit them. Example: [PAREN] (laughing)

CRITICAL INSTRUCTIONS FOR NOLLYWOOD/NIGERIAN SCRIPTS:
1. NO pidgin dialogues unless the user explicitly selects it or the plot strictly requires it.
2. NO market scenes.
3. NO use of juju/magic/witchcraft.
4. NO use of Nigerian proverbs anywhere in the script.

CRITICAL: Never use markdown formatting. Use ONLY the [TAG] system above.`;
    }

    const userPrompt = seedPlot || `Create a ${genre || 'Drama'} story concept.`;

    // For plot mapping, override the user prompt to enforce JSON
    // CRITICAL: Put instructions at the TOP to ensure model attention
    const finalUserPrompt = isPlotMapGeneration
      ? `INSTRUCTION: Respond ONLY with a valid JSON object. No conversational text.
DATA TO PROCESS:
${userPrompt}`
      : userPrompt;

    const bypassCache = requestBody.bypassCache === true;

    // Generate cache key - use finalUserPrompt to ensure instructions are part of the key
    const cacheKey = await generateCacheKey(activeProvider, activeModel, finalUserPrompt, systemPrompt);

    // Check cache
    const { data: cachedData } = (!bypassCache) ? await supabaseAdmin
      .from('ai_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single() : { data: null };

    if (cachedData) {
      // CACHE HIT!
      console.log(`✅ Cache hit for key: ${cacheKey.substring(0, 8)}...`);

      // Update hit count and last_accessed
      await supabaseAdmin
        .from('ai_cache')
        .update({
          hit_count: cachedData.hit_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', cachedData.id);

      // Log analytics
      await supabaseAdmin.rpc('update_cache_analytics', {
        p_user_id: user.id,
        p_is_hit: true,
        p_tokens_saved: cachedData.tokens_used,
        p_cost_saved: cachedData.cost_usd
      });

      // Calculate user stats
      const { data: userStats } = await supabaseAdmin.rpc('get_user_cache_stats', {
        p_user_id: user.id,
        p_days: 30
      });

      return new Response(JSON.stringify({
        content: cachedData.response_content,
        success: true,
        cache_info: {
          status: 'cache_hit',
          hit_rate_percent: userStats?.[0]?.hit_rate_percent || 0,
          tokens_saved: cachedData.tokens_used,
          cost_saved_usd: cachedData.cost_usd,
          cache_age_seconds: Math.floor((Date.now() - new Date(cachedData.created_at).getTime()) / 1000)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    //=============================================================================
    // AI CALL ENGINE with HAR Loop
    //=============================================================================

    async function performAICall(sys: string, user: string, currentProvider: string, currentModel: string) {
      console.log(`Starting AI call [${currentProvider}] - Model: [${currentModel}] - Type: [${promptType}]`);
      let url = "";
      let key = "";
      let bodyData: any = {};
      const callHeaders: Record<string, string> = { "Content-Type": "application/json" };

      switch (currentProvider) {
        case 'openai':
          url = "https://api.openai.com/v1/chat/completions";
          key = Deno.env.get("OPENAI_API_KEY") || getSetting('openai_api_key');
          callHeaders["Authorization"] = `Bearer ${key}`;
          bodyData = {
            model: currentModel || "gpt-4o",
            messages: [{ role: "system", content: sys }, { role: "user", content: user }],
            temperature: 0.3, // Lower temperature for more reliable JSON
            max_tokens: 4000,
            response_format: isPlotMapGeneration ? { type: "json_object" } : undefined
          };
          break;
        case 'anthropic':
          url = "https://api.anthropic.com/v1/messages";
          key = Deno.env.get("ANTHROPIC_API_KEY") || getSetting('anthropic_api_key');
          callHeaders["x-api-key"] = key;
          callHeaders["anthropic-version"] = "2023-06-01";
          bodyData = {
            model: currentModel || "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            messages: [{ role: "user", content: user }],
            system: sys,
            temperature: 0.3
          };
          break;
        case 'xai':
          url = "https://api.x.ai/v1/chat/completions";
          key = Deno.env.get("XAI_API_KEY") || getSetting('xai_api_key');
          callHeaders["Authorization"] = `Bearer ${key}`;
          bodyData = {
            model: currentModel || "grok-beta",
            messages: [{ role: "system", content: sys }, { role: "user", content: user }],
            temperature: 0.3,
            max_tokens: 4000
          };
          break;
        case 'deepseek':
        default:
          url = "https://api.deepseek.com/v1/chat/completions";
          key = Deno.env.get("DEEPSEEK_API_KEY") || getSetting('deepseek_api_key');
          callHeaders["Authorization"] = `Bearer ${key}`;
          bodyData = {
            model: currentModel || "deepseek-chat",
            messages: [{ role: "system", content: sys }, { role: "user", content: user }],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: isPlotMapGeneration ? { type: "json_object" } : undefined
          };
          break;
      }

      console.log(`[DEBUG] AI Request Body for ${currentProvider}:`, JSON.stringify(bodyData, null, 2));

      if (!key) throw new Error(`${currentProvider} API key not found`);
      const aiRes = await fetch(url, { method: "POST", headers: callHeaders, body: JSON.stringify(bodyData) });
      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error(`AI Provider Error (${currentProvider}):`, errText);
        throw new Error(`API error (${aiRes.status}): ${errText}`);
      }
      const aiData = await aiRes.json();
      const contentRes = currentProvider === 'anthropic' ? aiData.content[0].text : aiData.choices[0].message.content;
      console.log(`AI Response received (${contentRes?.length || 0} characters)`);
      return { content: contentRes, debug_request: bodyData };
    }

    // Phase 1: Initial Generation
    let { content, debug_request } = await performAICall(systemPrompt, finalUserPrompt, activeProvider, activeModel);
    let debugData = debug_request;

    // Phase 2: Hallucination-Aware Refinement (HAR)
    // Only apply to dialogue/script generation as it's the most sensitive to errors
    if (isScriptGeneration && !isPlotMapGeneration) {
      console.log("Starting HAR refinement loop...");
      let iterations = 0;
      const MAX_HAR_ITERATIONS = 2; // Increased to 2 for critical continuity

      while (iterations < MAX_HAR_ITERATIONS) {
        const batchDetails = currentBatchPlans && currentBatchPlans.length > 0
          ? `Current Scene ${currentBatchPlans[0].scene_number}: ${currentBatchPlans[0].goal}`
          : "Follow the provided synopsis.";

        const verificationPrompt = `You are a script supervisor. Review the following script fragment for:
        1. Context Adherence: Does this scene accurately follow the plan: ${batchDetails}?
        2. Rolling Memory: Does it acknowledge the story so far? ${requestBody.rollingContext || 'N/A'}
        3. Character consistency: Do characters act and speak according to their bios?
        4. Summary presence: Did the AI include the [SUMMARY] tag at the end?
        5. Formatting: Are [TAGS] used correctly?

        SCRIPT FRAGMENT:
        ${content}

        If there are missing elements, logic gaps, or bad formatting, list them clearly. If perfect, respond with "OK".`;

        const verifyRes = await performAICall("You are a strict script supervisor.", verificationPrompt, activeProvider, activeModel);
        const verificationResult = verifyRes.content;

        if (verificationResult.trim().toUpperCase() === "OK") {
          console.log("Scene verified successfully.");
          break;
        } else {
          console.log(`HAR Issues detected: ${verificationResult.substring(0, 50)}...`);
          const refinementPrompt = `Refine the script fragment based on this feedback:
          FEEDBACK: ${verificationResult}
          
          ORIGINAL FRAGMENT:
          ${content}
          
          Respond ONLY with the corrected script content using the [TAG] system.`;

          const refineRes = await performAICall(systemPrompt, refinementPrompt, activeProvider, activeModel);
          content = refineRes.content;
          iterations++;
        }
      }
    }

    // Content cleanup logic (Restored October 2025 Logic)
    if (content && !isPlotMapGeneration) {
      content = content.trim();
      // Remove common markdown formatting that AI might re-introduce
      content = content
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
        .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
        .replace(/#{1,6}\s*/g, '')          // Remove ## headers
        .replace(/^[\s-]*\*\s+/gm, '')      // Remove bullet points
        .replace(/^[\s-]*-\s+/gm, '')       // Remove dashes
        .replace(/```json\n?|```\n?/g, '')   // Remove only the code block markers, keep content
        .replace(/`([^`]+)`/g, '$1')        // Remove inline code markers
        .replace(/\n\s*\n\s*\n/g, '\n\n')  // Normalize multiple line breaks
        .trim();
    }

    // Calculate costs
    const inputTokens = estimateTokens(userPrompt + systemPrompt);
    const outputTokens = estimateTokens(content);
    const cost = calculateCost(activeModel, inputTokens, outputTokens);

    // Store in cache
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await supabaseAdmin.from('ai_cache').insert({
      cache_key: cacheKey,
      provider: activeProvider,
      model: activeModel,
      prompt_hash: cacheKey.substring(0, 16),
      response_content: content,
      tokens_used: inputTokens + outputTokens,
      cost_usd: cost,
      user_id: user.id,
      script_id: scriptId || null,
      cache_type: 'session',
      expires_at: expiresAt.toISOString()
    });

    // Log analytics
    await supabaseAdmin.rpc('update_cache_analytics', {
      p_user_id: user.id,
      p_is_hit: false,
      p_tokens_saved: 0,
      p_cost_saved: 0
    });

    const { data: userStats } = await supabaseAdmin.rpc('get_user_cache_stats', {
      p_user_id: user.id,
      p_days: 30
    });

    return new Response(JSON.stringify({
      content: content,
      success: true,
      debug_request: debugData,
      cache_info: {
        status: 'cache_miss',
        tokens_used: (content?.length || 0) / 4,
        cost_usd: ((content?.length || 0) / 4) * 0.000002
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
