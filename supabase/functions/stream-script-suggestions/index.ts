import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

//=============================================================================
// Cache & Cost Utilities
//=============================================================================

async function generateCacheKey(provider: string, model: string, prompt: string, context: string): Promise<string> {
  const normalized = JSON.stringify({ provider: provider.toLowerCase(), model, prompt: prompt.trim(), context: context.substring(0, 200) });
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 0.75);
}

const MODEL_PRICING: Record<string, { input: number, output: number }> = {
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error(`Auth failed`);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: settings } = await supabaseAdmin.from('system_settings').select('key, value');

    const getSetting = (k: string) => {
      const setting = settings?.find(s => s.key === k);
      if (!setting) return null;
      let val = setting.value;
      if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
      if (typeof val === 'string') val = val.replace(/^"+|"+$/g, '').replace(/\\"/g, '"');
      return val;
    };

    const activeProvider = getSetting('active_ai_provider') || 'deepseek';
    const activeModel = getSetting('active_ai_model') || 'deepseek-chat';

    const { prompt, context } = await req.json();
    const systemPrompt = "[NIGERIAN SCRIPT ASSISTANT] Give 3 highly relevant suggestions. Reply ONLY with one option per line. Ensure NIGERIAN tone.";
    const userPrompt = `Context: ${context}\n\nSuggest completions for: ${prompt}`;

    // Generate cache key (using truncated context to improve hit rate)
    const cacheKey = await generateCacheKey(activeProvider, activeModel, prompt, context);

    // Check cache
    const { data: cachedData } = await supabaseAdmin
      .from('ai_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Cache hit for suggestions`);

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

      return new Response(JSON.stringify({
        suggestions: cachedData.response_content.split('\n').filter(s => s.trim().length > 0),
        success: true,
        cache_info: {
          status: 'cache_hit',
          tokens_saved: cachedData.tokens_used,
          cost_saved_usd: cachedData.cost_usd
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CACHE MISS - Call AI
    console.log(`❌ Cache miss for suggestions, calling ${activeProvider}`);

    let apiUrl = "", apiKey = "", apiBody: any = {};
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    switch (activeProvider) {
      case 'openai':
        apiUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = Deno.env.get("OPENAI_API_KEY") || getSetting('openai_api_key');
        headers["Authorization"] = `Bearer ${apiKey}`;
        apiBody = {
          model: activeModel || "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: 0.7,
          max_tokens: 150
        };
        break;
      case 'anthropic':
        apiUrl = "https://api.anthropic.com/v1/messages";
        apiKey = Deno.env.get("ANTHROPIC_API_KEY") || getSetting('anthropic_api_key');
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        apiBody = {
          model: activeModel || "claude-3-5-sonnet-20241022",
          max_tokens: 150,
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt
        };
        break;
      case 'deepseek':
      default:
        apiUrl = "https://api.deepseek.com/v1/chat/completions";
        apiKey = Deno.env.get("DEEPSEEK_API_KEY") || getSetting('deepseek_api_key');
        headers["Authorization"] = `Bearer ${apiKey}`;
        apiBody = {
          model: activeModel || "deepseek-chat",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: 0.7,
          max_tokens: 150
        };
        break;
    }

    if (!apiKey) throw new Error(`${activeProvider} API key not found`);

    const response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(apiBody) });
    if (!response.ok) throw new Error(`API error (${response.status})`);

    const data = await response.json();
    const content = activeProvider === 'anthropic' ? data.content[0].text : data.choices[0].message.content;
    const suggestions = content.split('\n').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);

    // Calculate costs & cache
    const inputTokens = estimateTokens(userPrompt + systemPrompt);
    const outputTokens = estimateTokens(content);
    const cost = calculateCost(activeModel, inputTokens, outputTokens);

    await supabaseAdmin.from('ai_cache').insert({
      cache_key: cacheKey,
      provider: activeProvider,
      model: activeModel,
      prompt_hash: cacheKey.substring(0, 16),
      response_content: suggestions.join('\n'),
      tokens_used: inputTokens + outputTokens,
      cost_usd: cost,
      user_id: user.id,
      script_id: null,
      cache_type: 'session',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });

    await supabaseAdmin.rpc('update_cache_analytics', {
      p_user_id: user.id,
      p_is_hit: false,
      p_tokens_saved: 0,
      p_cost_saved: 0
    });

    return new Response(JSON.stringify({
      suggestions,
      success: true,
      cache_info: {
        status: 'cache_created',
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
