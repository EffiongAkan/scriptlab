import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import "https://deno.land/x/dotenv/load.ts";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";
const jwt = process.env.VITE_TEST_JWT || "";

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { headers: { Authorization: `Bearer ${jwt}` } }
});

async function run() {
  const { data, error } = await supabase.functions.invoke('admin-operations', {
    body: { operation: 'get_api_key_status' }
  });
  console.log(data || error);
}
run();
