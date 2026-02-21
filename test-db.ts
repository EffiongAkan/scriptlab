
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkTable() {
    try {
        const { data, error } = await supabase
            .from('script_analyses')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Table check failed:', error);
            if (error.code === '42P01') {
                console.error('CRITICAL: script_analyses table does not exist!');
            }
        } else {
            console.log('✅ script_analyses table exists and is accessible.');
        }
    } catch (e) {
        console.error('Unexpected error during table check:', e);
    }
}

checkTable();
