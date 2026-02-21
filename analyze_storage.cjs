
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

async function checkScripts() {
    console.log('--- Top Scripts by Element Count ---');

    // Get all scripts with their element counts
    const { data, error } = await supabase
        .from('scripts')
        .select('id, title, created_at');

    if (error) {
        console.error('Error fetching scripts:', error);
        return;
    }

    const scriptStats = [];

    for (const script of data) {
        const { count, error: countError } = await supabase
            .from('script_elements')
            .select('*', { count: 'exact', head: true })
            .eq('script_id', script.id);

        if (countError) {
            // console.error(`Error counting elements for ${script.id}:`, countError);
        } else {
            scriptStats.push({
                title: script.title,
                id: script.id,
                count: count,
                created: script.created_at
            });
        }
    }

    // Sort by count descending
    scriptStats.sort((a, b) => b.count - a.count);

    console.log('Top 20 scripts:');
    scriptStats.slice(0, 20).forEach((s, i) => {
        console.log(`${i + 1}. ${s.title} (${s.id}) - ${s.count} elements - Created: ${s.created}`);
    });

    // Check for orphaned elements
    const { count: orphanedCount, error: orphanError } = await supabase
        .rpc('get_orphaned_elements_count'); // If this RPC exists

    if (orphanError) {
        // If RPC doesn't exist, try manual check (this might be slow)
        console.log('Orphaned elements check requires more complex query or DB access.');
    }
}

checkScripts();
