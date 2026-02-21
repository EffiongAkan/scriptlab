
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabase = createClient(
    env.VITE_SUPABASE_URL || '',
    env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

async function cleanup() {
    console.log('--- Starting Database Cleanup ---');

    // 1. Identify Orphaned Elements
    // We'll use a subquery-like approach via client if possible or just get all IDs
    console.log('Checking for orphaned script_elements...');

    // Note: For 100k rows, we can't pull all IDs. We'll use a clever query.
    // We can't do NOT IN across tables easily in client, but we can try to find elements pointing to non-existent scripts.

    // A better way is to provide a SQL snippet for the user.
    console.log('SQL to run for orphans: DELETE FROM public.script_elements WHERE script_id NOT IN (SELECT id FROM public.scripts);');

    // 2. Identify potential test scripts to delete
    console.log('Searching for small/old test scripts...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldScripts, error } = await supabase
        .from('scripts')
        .select('id, title, created_at')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .limit(100);

    if (error) {
        console.error('Error fetching old scripts:', error);
        return;
    }

    console.log(`Found ${oldScripts.length} scripts older than 30 days.`);

    // For each old script, check if it's "empty" (less than 5 elements)
    let potentials = [];
    for (const script of oldScripts) {
        const { count } = await supabase
            .from('script_elements')
            .select('*', { count: 'exact', head: true })
            .eq('script_id', script.id);

        if (count !== null && count < 5) {
            potentials.push({ id: script.id, title: script.title, count });
        }
    }

    if (potentials.length > 0) {
        console.log(`Suggested for deletion (empty/old tests): ${potentials.length} scripts`);
        potentials.slice(0, 10).forEach(p => console.log(`- ${p.title} (${p.id}): ${p.count} elements`));
    } else {
        console.log('No suspicious empty test scripts found in the first batch of old scripts.');
    }
}

cleanup();
