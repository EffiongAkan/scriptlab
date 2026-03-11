-- Revert subscription plan prices back to USD
-- Pro plan: $19/month, $190/year
-- Enterprise plan: $49/month, $490/year

UPDATE public.subscription_plans
SET 
  monthly_price = 19,
  yearly_price = 190,
  updated_at = NOW()
WHERE id = 'pro';

UPDATE public.subscription_plans
SET 
  monthly_price = 49,
  yearly_price = 490,
  updated_at = NOW()
WHERE id = 'enterprise';

-- Verify the update
SELECT id, name, monthly_price, yearly_price FROM public.subscription_plans;
