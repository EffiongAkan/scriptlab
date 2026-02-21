-- Credit Transactions Table
-- Logs every AI credit deduction and purchase for real usage history

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- negative = deduction, positive = addition
  action TEXT NOT NULL,    -- e.g. 'plot_generation', 'script_generation', 'purchase'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure ai_credits is initialized correctly on profiles
ALTER TABLE public.profiles
  ALTER COLUMN ai_credits SET DEFAULT 25;

-- Ensure subscriptions table has tier and status (RLS already there from earlier migrations)
-- Add 'free' as default tier marker
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscriptions'
    AND column_name = 'tier'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN tier TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;
