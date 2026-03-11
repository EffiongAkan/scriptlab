import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)="?(.*?)"?$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function runTest() {
    console.log("Starting test...");

    const email = `test.delete.${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log("Signing up test user:", email);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError || !authData.user) {
        console.error("Auth error:", authError);
        return;
    }

    const userId = authData.user.id;

    // 1. Create a script
    console.log("Creating script...");
    const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .insert({ title: 'Delete Test Script WITH ELEMENTS', user_id: userId })
        .select()
        .single();

    if (scriptError || !scriptData) {
        console.error("Script create error:", scriptError);
        return;
    }

    const scriptId = scriptData.id;
    console.log("Created script:", scriptId);

    // 2. Add an element
    console.log("Adding element to script...");
    const { error: elementError } = await supabase
        .from('script_elements')
        .insert({
            script_id: scriptId,
            type: 'heading', // Corrected type
            content: 'INT. TEST - DAY',
            position: 0
        });

    if (elementError) {
        console.error("Element create error:", elementError);
    } else {
        console.log("Element added.");
    }

    // 3. Try deleting it immediately
    console.log("Attempting to delete populated script...");
    const { error: deleteError } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);

    if (deleteError) {
        console.error("Delete error details:");
        console.dir(deleteError, { depth: null });
    } else {
        console.log("Populated script deleted successfully!");
    }
}

runTest();
