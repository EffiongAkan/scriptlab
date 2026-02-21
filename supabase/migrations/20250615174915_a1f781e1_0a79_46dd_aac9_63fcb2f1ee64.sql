
-- Store all subscription info for a user
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- e.g. 'active', 'canceled'
  tier TEXT NOT NULL,   -- e.g. 'pro', 'enterprise'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ, -- nullable, if set: end of paid period
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can upsert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subs" ON public.subscriptions FOR UPDATE USING (user_id = auth.uid());

-- Store credits package purchases & logs
CREATE TABLE public.credits_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  credits_added INT NOT NULL,
  price_paid NUMERIC(10,2) NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credits_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits_purchases" ON public.credits_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own credits_purchases" ON public.credits_purchases FOR INSERT WITH CHECK (user_id = auth.uid());

-- Templates marketplace: track which templates a user has purchased/unlocked
CREATE TABLE public.templates_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_paid NUMERIC(10,2) NOT NULL
);
ALTER TABLE public.templates_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own template purchases" ON public.templates_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own template purchases" ON public.templates_purchases FOR INSERT WITH CHECK (user_id = auth.uid());

-- Producers platform: track script submissions (historical log; not for script content, just submission)
CREATE TABLE public.producer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_title TEXT NOT NULL,
  producer_id TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending/reviewing/accepted/rejected
  feedback TEXT
);
ALTER TABLE public.producer_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own producer submissions" ON public.producer_submissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own producer submissions" ON public.producer_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own producer submissions" ON public.producer_submissions FOR UPDATE USING (user_id = auth.uid());
