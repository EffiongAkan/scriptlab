
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

async function checkBloat() {
    console.log('--- Checking for Bloat ---');

    // 1. Check for duplicate elements (same script_id and position)
    // This is hard to do via client, but we can look at a few scripts

    // 2. Check plot_map size for top scripts
    const { data: scripts, error: scriptError } = await supabase
        .from('scripts')
        .select('id, title, plot_map')
        .limit(50);

    if (scriptError) {
        console.error('Error fetching scripts:', scriptError);
        return;
    }

    let totalPlotMapSize = 0;
    scripts.forEach(s => {
        if (s.plot_map) {
            const size = JSON.stringify(s.plot_map).length;
            totalPlotMapSize += size;
            if (size > 100000) { // > 100KB
                console.log(`Large Plot Map: ${s.title} (${s.id}) - ${Math.round(size / 1024)} KB`);
            }
        }
    });

    console.log(`Total Plot Map size for 50 scripts: ${Math.round(totalPlotMapSize / 1024)} KB`);
    console.log(`Estimated Plot Map size for all 240 scripts: ${Math.round((totalPlotMapSize / 50) * 240 / 1024)} KB`);

    // 3. Check for script_elements with very long content
    const { data: longElements, error: elementError } = await supabase
        .from('script_elements')
        .select('id, script_id, content')
        .ilike('content', '%.%') // just to get some content
        .limit(10); // Check a few

    if (longElements) {
        longElements.forEach(e => {
            // console.log(`Element ${e.id} content length: ${e.content?.length}`);
        });
    }
}

checkBloat();
