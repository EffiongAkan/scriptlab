
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const envs = {
        ANTHROPIC_API_KEY: Deno.env.get("ANTHROPIC_API_KEY") ? `Set (Length: ${Deno.env.get("ANTHROPIC_API_KEY").length}, Prefix: ${Deno.env.get("ANTHROPIC_API_KEY").substring(0, 7)})` : "MISSING",
        OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY") ? "Set" : "MISSING",
        DEEPSEEK_API_KEY: Deno.env.get("DEEPSEEK_API_KEY") ? "Set" : "MISSING",
        SUPABASE_URL: Deno.env.get("SUPABASE_URL") ? "Set" : "MISSING",
        SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "Present" : "MISSING"
    };

    return new Response(JSON.stringify({
        status: "online",
        diagnostics: envs,
        timestamp: new Date().toISOString()
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
});
