import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/constants/subscriptionPlans';

export type { SubscriptionTier };

export interface SubscriptionData {
  subscribed: boolean;
  tier: SubscriptionTier;
  subscription_end?: string | null;
  starts_at?: string | null;
}

const PLAN_LIMITS: Record<SubscriptionTier, { scripts: number; aiGenerations: number; collaborators: number }> =
  SUBSCRIPTION_PLANS.reduce((acc, plan) => ({
    ...acc,
    [plan.id]: {
      scripts: plan.limits.scripts,
      aiGenerations: plan.limits.aiCreditsPerMonth,
      collaborators: plan.limits.collaborators
    }
  }), {} as any);

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData>({ subscribed: false, tier: 'free' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription({ subscribed: false, tier: 'free' });
        return;
      }

      // Fetch subscription from DB
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSubscription({ subscribed: false, tier: 'free' });
        return;
      }

      // Check if subscription is still valid
      const isActive = !data.ends_at || new Date(data.ends_at) > new Date();
      const tier = (data.tier as SubscriptionTier) || 'free';

      setSubscription({
        subscribed: isActive && tier !== 'free',
        tier: isActive ? tier : 'free',
        subscription_end: data.ends_at,
        starts_at: data.started_at,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false, tier: 'free' });
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (tier: SubscriptionTier, interval: 'month' | 'year' = 'month'): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Determine if we're downgrading to free
      if (tier === 'free') {
        console.warn("Downgrading to free requires cancellation via Paystack.");
        return { success: false, error: 'To cancel your subscription, please contact support.' };
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { tier, interval }
      });

      // Supabase wraps errors; also check data.error for backend use case
      const errorMsg = error?.message || data?.error || null;

      if (errorMsg) throw new Error(errorMsg);

      if (data?.url) {
        // Redirect to Paystack Checkout
        window.location.href = data.url;
        return { success: true };
      } else {
        throw new Error('No checkout URL returned from payment server.');
      }
    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getLimits = () => PLAN_LIMITS[subscription.tier];

  return {
    subscription,
    loading,
    checkSubscription,
    upgradeSubscription,
    getLimits,
    planLimits: PLAN_LIMITS,
  };
}