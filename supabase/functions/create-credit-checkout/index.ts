import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured in Supabase secrets.')
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
      throw new Error('Unauthorized')
    }

    const { packageId, credits, bonus } = await req.json()

    if (!credits || credits < 10) {
      throw new Error('A minimum of 10 credits must be purchased.')
    }

    // Determine the callback URL
    const origin = req.headers.get('origin') || 'http://localhost:8080'
    const totalCredits = credits + (bonus || 0)

    // Calculate price based on base credits (excluding bonus). $0.10 per credit.
    // Paystack takes amounts in cents. $0.10 = 10 cents per credit.
    const amountInCents = credits * 10

    // --- CONVERT USD TO NGN ---
    // Exchange rate assumption: 1 USD = 1500 NGN
    const exchangeRate = 1500
    const amountInDollars = amountInCents / 100
    const amountInKobo = Math.round(amountInDollars * exchangeRate * 100)

    // Generate a unique reference
    const reference = `credit_${user.id.substring(0, 8)}_${totalCredits}_${Date.now()}`

    // Build the Paystack transaction initialization payload
    const paystackPayload = {
      email: user.email,
      amount: amountInKobo,
      currency: 'NGN',
      reference,
      callback_url: `${origin}/premium?credit_success=true&reference=${reference}`,
      metadata: {
        type: 'credit_purchase',
        supabase_user_id: user.id,
        credits_amount: totalCredits,
        package_id: packageId || 'custom',
        cancel_action: `${origin}/premium?credit_canceled=true`,
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
      console.error('Paystack error:', paystackData)
      throw new Error(paystackData.message || 'Failed to initialize Paystack transaction')
    }

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
