import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set");
    }
    logStep("Paystack key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { reference } = await req.json();
    if (!reference) {
      throw new Error("Payment reference is required");
    }

    logStep("Verifying payment", { reference });

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!data.status || data.data.status !== "success") {
      throw new Error(`Payment verification failed: ${data.message}`);
    }

    const paymentData = data.data;
    logStep("Payment verified successfully", { 
      amount: paymentData.amount / 100,
      email: paymentData.customer.email,
      reference: paymentData.reference
    });

    // Determine subscription tier from amount
    const amountInNaira = paymentData.amount / 100;
    let subscriptionTier = "Basic";
    let subscriptionDuration = 30; // days

    if (amountInNaira >= 29999) {
      subscriptionTier = "Enterprise";
    } else if (amountInNaira >= 9999) {
      subscriptionTier = "Professional";
    }

    // Calculate subscription end date
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + subscriptionDuration);

    // Update subscription in database
    await supabaseClient.from("subscribers").upsert({
      email: paymentData.customer.email,
      user_id: paymentData.metadata?.user_id || null,
      stripe_customer_id: null, // Not using Stripe
      subscribed: true,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Subscription updated in database", { 
      email: paymentData.customer.email,
      tier: subscriptionTier,
      endDate: subscriptionEnd.toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd.toISOString(),
      message: "Payment processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});