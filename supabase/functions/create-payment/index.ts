
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// For AI credit packs

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const authHeader = req.headers.get("Authorization")!;
    let token, user, userEmail;
    if (authHeader) {
      token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      userEmail = user?.email || "guest@example.com";
    } else {
      userEmail = "guest@example.com";
    }

    const { pack } = await req.json();
    // Map pack id to price and credits
    const packs = {
      small: { credits: 50, price: 999 },
      medium: { credits: 175, price: 2499 },
      large: { credits: 375, price: 4499 },
      xl: { credits: 800, price: 7999 },
      custom: { credits: 0, price: 0 }
    };
    let chosen = packs[pack];
    if (!chosen && pack && pack.customAmount) {
      chosen = {
        credits: pack.customAmount,
        price: Math.round(pack.customAmount * 20), // $0.20/credit
      };
    }
    if (!chosen) throw new Error("Pack not found");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `AI Credits (${chosen.credits} credits)` },
            unit_amount: chosen.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/settings?credits=success`,
      cancel_url: `${req.headers.get("origin")}/settings?credits=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
