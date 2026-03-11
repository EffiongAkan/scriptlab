import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fallback prices in USD cents in case the DB lookup fails
// Pro: $25/mo, $250/yr | Enterprise: $55/mo, $550/yr
const FALLBACK_PRICES: Record<string, { month: number; year: number }> = {
  pro: { month: 2500, year: 25000 },        // $25/mo, $250/yr
  enterprise: { month: 5500, year: 55000 }, // $55/mo, $550/yr
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not set. Please configure it in Supabase Edge Function secrets.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized: User not authenticated.')
    }

    const { tier, interval } = await req.json()

    if (!tier || !interval) {
      throw new Error('tier and interval are required fields.')
    }

    if (tier === 'free') {
      throw new Error('Cannot create a checkout session for the free plan.')
    }

    // Determine the callback URL
    const origin = req.headers.get('origin') || 'https://naijascriptscribe.com'

    // Attempt to fetch the subscription plan from the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let amountInCents: number

    const { data: planData, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('monthly_price, yearly_price')
      .eq('id', tier)
      .eq('is_active', true)
      .maybeSingle()

    if (planError || !planData) {
      // Fallback to hardcoded prices
      console.warn(`Plan '${tier}' not found in DB. Using fallback prices. DB error: ${planError?.message}`)
      const fallback = FALLBACK_PRICES[tier]
      if (!fallback) {
        throw new Error(`Invalid subscription tier: '${tier}'. Valid tiers are: pro, enterprise.`)
      }
      amountInCents = interval === 'year' ? fallback.year : fallback.month
    } else {
      // DB stores prices in USD — convert to cents (multiply by 100)
      const priceAmount = interval === 'month' ? planData.monthly_price : planData.yearly_price
      amountInCents = Math.round(Number(priceAmount) * 100)
    }

    if (amountInCents <= 0) {
      throw new Error('Invalid plan price. Cannot checkout a free plan.')
    }

    // --- CONVERT USD TO NGN ---
    // Exchange rate assumption: 1 USD = 1500 NGN
    // amountInCents is e.g. 2500 ($25.00). In dollars that is 25.
    // 25 * 1500 = 37,500 NGN.
    // Paystack takes Kobo, so multiply by 100 -> 3,750,000 Kobo.
    const exchangeRate = 1500
    const amountInDollars = amountInCents / 100
    const amountInKobo = Math.round(amountInDollars * exchangeRate * 100)

    // Generate a unique reference
    const reference = `sub_${user.id.substring(0, 8)}_${tier}_${interval}_${Date.now()}`

    // Build the Paystack transaction initialization payload
    const paystackPayload: Record<string, any> = {
      email: user.email,
      amount: amountInKobo,
      currency: 'NGN',
      reference,
      callback_url: `${origin}/premium?success=true&reference=${reference}`,
      metadata: {
        supabase_user_id: user.id,
        tier,
        interval,
        cancel_action: `${origin}/premium?canceled=true`,
      },
    }

    // Initialize the transaction via Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('Paystack API error:', paystackData)
      throw new Error(paystackData.message || 'Failed to initialize Paystack transaction.')
    }

    // Store the pending transaction reference so the webhook can match it
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: user.id,
      paystack_reference: reference,
      tier: tier,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return new Response(JSON.stringify({
      url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Paystack checkout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
