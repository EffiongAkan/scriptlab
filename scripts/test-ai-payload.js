import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction() {
    console.log("Authenticating...");
    // Note: we might need an actual session, but for testing let's see if anon works
    // or just look at the payload we send from the frontend.
    try {
        const requestBody = {
            prompt: "Based on the provided screenplay content, write a comprehensive and engaging treatment (prose summary of the story).",
            context: "Title: My Real Script Title\n\nSCRIPT EXCERPT:\nINT. COFFEE SHOP - DAY\nBob drinks coffee.",
            synopsis: "", // explicitly empty to force context
            sceneDescription: "Treatment generation",
            tone: "Dramatic",
            maxTokens: 3000,
            temperature: 0.7,
            feature: "development"
        };

        console.log("Payload:", JSON.stringify(requestBody, null, 2));

        // We can't easily invoke without auth from node script since the Edge Function requires Auth headers.
        // Instead of actually making the request, let's verify if the problem is in `src/services/ai-service.ts` dropping fields.

        console.log("Checking how ai-service.ts maps this payload...");
    } catch (err) {
        console.error(err);
    }
}

testEdgeFunction();
