import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error("No service role key found. Skipping DB automatic update.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function updatePlans() {
    console.log("Updating pricing in subscription_plans...");

    const { error: proError } = await supabaseAdmin
        .from('subscription_plans')
        .update({ monthly_price: 19, yearly_price: 190, updated_at: new Date().toISOString() })
        .eq('id', 'pro');

    if (proError) console.error("Error updating pro:", proError);
    else console.log("Pro plan updated to $19/$190.");

    const { error: entError } = await supabaseAdmin
        .from('subscription_plans')
        .update({ monthly_price: 49, yearly_price: 490, updated_at: new Date().toISOString() })
        .eq('id', 'enterprise');

    if (entError) console.error("Error updating enterprise:", entError);
    else console.log("Enterprise plan updated to $49/$490.");
}

updatePlans();
