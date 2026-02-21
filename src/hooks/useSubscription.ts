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

  const upgradeSubscription = async (tier: SubscriptionTier) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // For manual/admin upgrade (no Stripe). In production, this gets called after payment webhook.
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);

    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      tier,
      status: 'active',
      started_at: new Date().toISOString(),
      ends_at: endsAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (!error) {
      await checkSubscription();
      return true;
    }
    return false;
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