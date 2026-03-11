import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') as string

serve(async (req) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return new Response('Webhook secret not configured', { status: 500 })
    }

    const body = await req.text()

    // Verify the webhook signature from Paystack
    const signature = req.headers.get('x-paystack-signature')
    const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (signature !== hash) {
      console.error('Invalid Paystack webhook signature')
      return new Response('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(body)

    // Admin client to update the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Processing Paystack event: ${event.event}`)

    if (event.event === 'charge.success') {
      const data = event.data
      const reference = data.reference as string
      const customerEmail = data.customer?.email
      const customerCode = data.customer?.customer_code
      const metadata = data.metadata || {}

      const supabaseUserId = metadata.supabase_user_id

      if (metadata.type === 'credit_purchase') {
        const creditsAmount = Number(metadata.credits_amount)
        if (!supabaseUserId || isNaN(creditsAmount)) {
          console.error('Missing data for credit purchase:', { metadata })
          return new Response(JSON.stringify({ received: true }), { status: 200 })
        }

        // Fetch current credits
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('ai_credits')
          .eq('id', supabaseUserId)
          .maybeSingle()

        const currentCredits = profile?.ai_credits ?? 0
        const newCredits = currentCredits + creditsAmount

        // Add credits
        await supabaseAdmin.from('profiles').update({
          ai_credits: newCredits
        }).eq('id', supabaseUserId)

        // Log transaction
        await supabaseAdmin.from('credit_transactions').insert({
          user_id: supabaseUserId,
          amount: creditsAmount,
          action: 'purchase',
          description: `Purchased ${creditsAmount} credits (Paystack ${reference})`
        })

        console.log(`Successfully added ${creditsAmount} credits to user: ${supabaseUserId}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      // Existing logic for subscriptions below...
      const tierId = metadata.tier
      const interval = metadata.interval || 'month'

      if (!supabaseUserId || !tierId) {
        console.error('Missing metadata in Paystack charge event:', { reference, metadata })
        // Try to find the user by the pending reference
        const { data: pendingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, tier')
          .eq('paystack_reference', reference)
          .eq('status', 'pending')
          .maybeSingle()

        if (!pendingSub) {
          console.error('Could not find pending subscription for reference:', reference)
          return new Response(JSON.stringify({ received: true }), { status: 200 })
        }

        // Use the pending subscription data
        const endsAt = new Date()
        if (interval === 'year') {
          endsAt.setFullYear(endsAt.getFullYear() + 1)
        } else {
          endsAt.setMonth(endsAt.getMonth() + 1)
        }

        await supabaseAdmin.from('subscriptions').update({
          paystack_customer_code: customerCode,
          paystack_reference: reference,
          status: 'active',
          started_at: new Date().toISOString(),
          ends_at: endsAt.toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', pendingSub.user_id)

        console.log(`Activated subscription for user (from pending): ${pendingSub.user_id}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      // Calculate subscription end date
      const endsAt = new Date()
      if (interval === 'year') {
        endsAt.setFullYear(endsAt.getFullYear() + 1)
      } else {
        endsAt.setMonth(endsAt.getMonth() + 1)
      }

      // Check for existing subscription to avoid upsert constraint errors
      const { data: existingUserSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', supabaseUserId)
        .limit(1)
        .maybeSingle()

      const subData = {
        paystack_customer_code: customerCode,
        paystack_reference: reference,
        tier: tierId,
        status: 'active',
        started_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (existingUserSub) {
        await supabaseAdmin.from('subscriptions').update(subData).eq('id', existingUserSub.id)
      } else {
        await supabaseAdmin.from('subscriptions').insert({
          user_id: supabaseUserId,
          ...subData
        })
      }

      console.log(`Successfully activated subscription for user: ${supabaseUserId}, tier: ${tierId}`)
    }

    if (event.event === 'subscription.create') {
      const data = event.data
      const customerCode = data.customer?.customer_code

      if (customerCode) {
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('paystack_customer_code', customerCode)
          .maybeSingle()

        if (existingSub?.user_id) {
          await supabaseAdmin.from('subscriptions').update({
            paystack_subscription_code: data.subscription_code,
            status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('user_id', existingSub.user_id)

          console.log(`Linked Paystack subscription for user: ${existingSub.user_id}`)
        }
      }
    }

    if (event.event === 'subscription.not_renew' || event.event === 'subscription.disable') {
      const data = event.data
      const subscriptionCode = data.subscription_code

      if (subscriptionCode) {
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('paystack_subscription_code', subscriptionCode)
          .maybeSingle()

        if (existingSub?.user_id) {
          await supabaseAdmin.from('subscriptions').update({
            status: 'canceled',
            tier: 'free',
            updated_at: new Date().toISOString(),
          }).eq('user_id', existingSub.user_id)

          console.log(`Canceled subscription for user: ${existingSub.user_id}`)
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error(`Paystack Webhook Error: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
