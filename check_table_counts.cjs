
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

async function getStats() {
    const tables = [
        'scripts',
        'script_elements',
        'script_activities',
        'ai_usage_logs',
        'ai_cache',
        'script_analyses',
        'profiles'
    ];

    console.log('--- Database Row Counts ---');
    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`${table}: Error - ${error.message}`);
            } else {
                console.log(`${table}: ${count} rows`);
            }
        } catch (e) {
            console.log(`${table}: Exception - ${e.message}`);
        }
    }
}

getStats();
