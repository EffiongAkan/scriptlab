
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
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
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`${table}: Error - ${error.message}`);
        } else {
            console.log(`${table}: ${count} rows`);
        }
    }
}

getStats();
