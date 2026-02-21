import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Star, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useAICredits } from '@/hooks/useAICredits';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SUBSCRIPTION_PLANS, SubscriptionTier, SubscriptionPlan } from '@/constants/subscriptionPlans';
import { supabase } from '@/integrations/supabase/client';

export const SubscriptionManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [fetchingPlans, setFetchingPlans] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setFetchingPlans(true);
        const { data, error } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .eq('is_active', true)
          .order('monthly_price', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setPlans(data.map(plan => ({
            id: plan.id as SubscriptionTier,
            name: plan.name,
            description: plan.description,
            monthlyPrice: Number(plan.monthly_price),
            yearlyPrice: Number(plan.yearly_price) || Number(plan.monthly_price) * 10,
            features: plan.features || [],
            limits: {
              scripts: plan.limits?.scripts || 0,
              aiCreditsPerMonth: plan.limits?.aiCreditsPerMonth || 0,
              collaborators: plan.limits?.collaborators || 0,
              exports: plan.limits?.exports || 0
            },
            popular: plan.is_popular
          })));
        } else {
          setPlans(SUBSCRIPTION_PLANS);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans(SUBSCRIPTION_PLANS);
      } finally {
        setFetchingPlans(false);
      }
    };

    fetchPlans();
  }, []);
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionTier | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { subscription, upgradeSubscription, loading } = useSubscription();
  const { data: credits } = useAICredits();
  const { toast } = useToast();

  const currentPlan = subscription.tier;

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const handleUpgradeRequest = async () => {
    if (!upgradeTarget) return;
    setIsUpgrading(true);
    try {
      const success = await upgradeSubscription(upgradeTarget);
      if (success) {
        toast({ title: '✅ Subscription Updated', description: `You are now on the ${upgradeTarget} plan.` });
        setUpgradeTarget(null);
      } else {
        toast({ title: 'Error', description: 'Could not update subscription.', variant: 'destructive' });
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentLimits = plans.find((p) => p.id === currentPlan)?.limits ?? plans[0].limits;

  return (
    <div className="space-y-6">
      {/* Current Plan Banner */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan: <span className="capitalize font-bold text-primary">{currentPlan}</span>
            {subscription.subscribed && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>AI Credits Remaining</span>
                <span className="text-muted-foreground">{credits ?? 0}</span>
              </div>
              <Progress value={getUsagePercentage(credits ?? 0, currentLimits.aiCreditsPerMonth)} />
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Collaborators</span>
                <span className="text-muted-foreground">
                  {currentLimits.collaborators === -1 ? 'Unlimited' : currentLimits.collaborators}
                </span>
              </div>
            </div>
          </div>
          {subscription.subscription_end && (
            <p className="text-xs text-muted-foreground">
              Renews / Expires: {new Date(subscription.subscription_end).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Interval Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
          <Button
            variant={selectedInterval === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedInterval('month')}
          >
            Monthly
          </Button>
          <Button
            variant={selectedInterval === 'year' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedInterval('year')}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = selectedInterval === 'month' ? plan.monthlyPrice : plan.yearlyPrice;
          const isCurrent = currentPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.id === 'enterprise' && <Crown className="h-5 w-5" />}
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold">
                  ${price}
                  <span className="text-sm font-normal text-muted-foreground">/{selectedInterval}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'secondary'}
                  disabled={isCurrent || loading}
                  onClick={() => plan.id !== 'free' && setUpgradeTarget(plan.id)}
                >
                  {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={!!upgradeTarget} onOpenChange={() => setUpgradeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {upgradeTarget} Plan</DialogTitle>
            <DialogDescription>
              Contact your system administrator to process payment, or this will be activated immediately for demo purposes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeTarget(null)}>Cancel</Button>
            <Button onClick={handleUpgradeRequest} disabled={isUpgrading}>
              {isUpgrading ? 'Activating...' : 'Confirm Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
