import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
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
// Content Cleaning
//=============================================================================

const cleanScriptContent = (content: string): string => {
  let cleaned = content;
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/##\s*/g, '');
  cleaned = cleaned.replace(/#\s*/g, '');
  cleaned = cleaned.replace(/___/g, '');
  cleaned = cleaned.replace(/---/g, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');

  const lines = cleaned.split('\n');
  cleaned = lines.join('\n');
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  cleaned = cleaned.replace(/^[ \t]+/gm, '');
  cleaned = cleaned.replace(/\[SCENE \d+\]/gi, '');
  cleaned = cleaned.replace(/\[CHARACTER PROFILE:.*?\]/gi, '');
  cleaned = cleaned.replace(/\[SETTING:.*?\]/gi, '');

  return cleaned.trim();
};

//=============================================================================
// Main Handler
//=============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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

    const { data: settings } = await supabaseAdmin.from('system_settings').select('key, value');

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
    const {
      synopsis,
      sceneDescription,
      tone,
      scriptId,
      customSystemPrompt,
      promptOverride,
      prompt,
      context,
      isAnalysis,
      maxTokens,
      temperature
    } = requestBody;

    // Use custom system prompt if provided, otherwise fallback to default expert screenwriter
    const systemPrompt = customSystemPrompt || `You are an expert professional screenwriter. 
    Write authentic, engaging screenplay content in industry-standard format.
    ALWAYS use the following tag format for EVERY element:
    [HEADING] INT./EXT. LOCATION - TIME
    [ACTION] Scene description...
    [CHARACTER] NAME
    [PAREN] (parenthetical)
    [DIALOGUE] Character dialogue...
    [TRANSITION] CUT TO:
    
    DO NOT include placeholder labels like "(PAREN)" or "Character Name" inside the tags. 
    Only output the screenplay content and tags.`;

    // Construct user prompt with robust context handling
    // We prioritize keeping context even if a direct prompt is given
    let userPrompt = "";

    // Background info block
    const backgroundInfo = `[SCRIPT CONTEXT/SYNOPSIS]\n${synopsis || context || 'New project, utilize creative freedom.'}\n\n`;

    if (prompt) {
      // If a prompt is provided, we wrap it with the background info for maximum clarity
      userPrompt = `${backgroundInfo}[USER INSTRUCTION/PROMPT]\n${prompt}`;
    } else if (promptOverride) {
      userPrompt = promptOverride;
    } else {
      userPrompt = `${backgroundInfo}[TASK]\n${sceneDescription || 'Enhance the scene.'}`;
    }

    if (tone) {
      userPrompt += `\n\n[TONE/STYLE REFERENCE]\n${tone}`;
    }

    // Generate cache key
    const cacheKey = await generateCacheKey(activeProvider, activeModel, userPrompt, systemPrompt);

    // Check cache
    const { data: cachedData } = await supabaseAdmin
      .from('ai_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Cache hit for script generation`);

      await supabaseAdmin
        .from('ai_cache')
        .update({ hit_count: cachedData.hit_count + 1, last_accessed: new Date().toISOString() })
        .eq('id', cachedData.id);

      await supabaseAdmin.rpc('update_cache_analytics', {
        p_user_id: user.id,
        p_is_hit: true,
        p_tokens_saved: cachedData.tokens_used,
        p_cost_saved: cachedData.cost_usd
      });

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

    // CACHE MISS - Call AI
    console.log(`❌ Cache miss for script generation, calling ${activeProvider}`);

    let apiUrl = "", apiKey = "", apiData: any = {};
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    switch (activeProvider) {
      case 'openai':
        apiUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = Deno.env.get("OPENAI_API_KEY") || getSetting('openai_api_key');
        headers["Authorization"] = `Bearer ${apiKey}`;
        apiData = {
          model: activeModel || "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 1000
        };
        if (isAnalysis) {
          apiData.response_format = { type: "json_object" };
        }
        break;
      case 'anthropic':
        apiUrl = "https://api.anthropic.com/v1/messages";
        apiKey = Deno.env.get("ANTHROPIC_API_KEY") || getSetting('anthropic_api_key');
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        apiData = {
          model: activeModel || "claude-3-5-sonnet-20241022",
          max_tokens: maxTokens || 3000,
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt
        };
        break;
      case 'xai':
        apiUrl = "https://api.x.ai/v1/chat/completions";
        apiKey = Deno.env.get("XAI_API_KEY") || getSetting('xai_api_key');
        headers["Authorization"] = `Bearer ${apiKey}`;
        apiData = {
          model: activeModel || "grok-beta",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 1000
        };
        break;
      case 'deepseek':
      default:
        apiUrl = "https://api.deepseek.com/v1/chat/completions";
        apiKey = Deno.env.get("DEEPSEEK_API_KEY") || getSetting('deepseek_api_key');
        headers["Authorization"] = `Bearer ${apiKey}`;
        apiData = {
          model: activeModel || "deepseek-chat",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 1000
        };
        if (isAnalysis) {
          apiData.response_format = { type: "json_object" };
        }
        break;
    }

    if (!apiKey) throw new Error(`${activeProvider} API key not found`);

    console.log(`[Diagnostic] Calling ${activeProvider} API: ${apiUrl}`);
    const response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(apiData) });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI API Error] Provider: ${activeProvider}, Status: ${response.status}, Body: ${errorText}`);
      // Return 200 with success: false and error details so the client can log them
      return new Response(JSON.stringify({
        error: `AI Provider (${activeProvider}) error ${response.status}: ${errorText}`,
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    let content = activeProvider === 'anthropic' ? data.content[0].text : data.choices[0].message.content;

    if (isAnalysis) {
      console.log(`[Analysis Diagnostic] Prompt length: ${userPrompt.length}, Response length: ${content.length}`);
      // Log first/last 100 chars to debug refusals
      console.log(`[Analysis Diagnostic] Response Start: ${content.substring(0, 100)}`);
      console.log(`[Analysis Diagnostic] Response End: ${content.substring(content.length - 100)}`);
    }

    // Only clean content if it's not an analysis request
    if (!isAnalysis) {
      content = cleanScriptContent(content);
    }

    // Calculate costs & cache
    const inputTokens = estimateTokens(userPrompt + systemPrompt);
    const outputTokens = estimateTokens(content);
    const cost = calculateCost(activeModel, inputTokens, outputTokens);

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
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });

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
      content,
      success: true,
      cache_info: {
        status: 'cache_created',
        hit_rate_percent: userStats?.[0]?.hit_rate_percent || 0,
        tokens_saved: 0,
        cost_saved_usd: 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});