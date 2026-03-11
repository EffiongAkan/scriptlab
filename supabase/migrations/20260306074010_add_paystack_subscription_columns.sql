-- Add Paystack-specific columns for webhook integration
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS paystack_customer_code text,
ADD COLUMN IF NOT EXISTS paystack_subscription_code text,
ADD COLUMN IF NOT EXISTS paystack_reference text;

-- Create indexes for faster lookups during webhook events
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_customer_code ON public.subscriptions(paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference ON public.subscriptions(paystack_reference);
