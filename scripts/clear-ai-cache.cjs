const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or SERVICE ROLE KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCache() {
    console.log("Clearing AI Cache...");

    try {
        const { error } = await supabase
            .from('ai_cache')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            console.error("Failed to delete cache:", error);
        } else {
            console.log("Cache cleared successfully!");
        }
    } catch (err) {
        console.error(err);
    }
}

clearCache();
