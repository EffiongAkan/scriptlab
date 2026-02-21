
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

async function checkTopScripts() {
    console.log('--- Top Scripts Analysis ---');

    // 1. Get total element count
    const { count: totalElements } = await supabase
        .from('script_elements')
        .select('*', { count: 'exact', head: true });

    console.log(`Total elements: ${totalElements}`);

    // 2. Identify scripts with > 500 elements (potential bloat)
    const { data: scripts, error } = await supabase
        .from('scripts')
        .select('id, title, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total scripts: ${scripts.length}`);

    const results = [];
    // Process in batches to avoid timing out or hitting limits
    const batchSize = 25;
    for (let i = 0; i < scripts.length; i += batchSize) {
        const batch = scripts.slice(i, i + batchSize);
        const promises = batch.map(async s => {
            const { count } = await supabase
                .from('script_elements')
                .select('*', { count: 'exact', head: true })
                .eq('script_id', s.id);
            return { ...s, elementCount: count || 0 };
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        // Check if we've found enough large ones to be helpful
        const largeOnes = results.filter(r => r.elementCount > 300);
        if (largeOnes.length > 20) break;
    }

    results.sort((a, b) => b.elementCount - a.elementCount);

    console.log('\nTop 15 Largest Scripts:');
    results.slice(0, 15).forEach((r, i) => {
        console.log(`${i + 1}. "${r.title}" - ${r.elementCount} elements (ID: ${r.id})`);
    });

    const sumTop15 = results.slice(0, 15).reduce((sum, r) => sum + r.elementCount, 0);
    console.log(`\nDeleting these top 15 would remove ~${sumTop15} elements (${Math.round(sumTop15 / totalElements * 100)}% of element table).`);
}

checkTopScripts();
