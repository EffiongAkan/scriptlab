-- Update subscription plan prices from USD to NGN
-- Pro plan: ₦15,000/month, ₦150,000/year
-- Enterprise plan: ₦45,000/month, ₦450,000/year

UPDATE public.subscription_plans
SET 
  monthly_price = 15000,
  yearly_price = 150000,
  updated_at = NOW()
WHERE id = 'pro';

UPDATE public.subscription_plans
SET 
  monthly_price = 45000,
  yearly_price = 450000,
  updated_at = NOW()
WHERE id = 'enterprise';

-- Verify the update
SELECT id, name, monthly_price, yearly_price FROM public.subscription_plans;
