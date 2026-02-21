-- Create subscription_plans table for persistent management
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    yearly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    features TEXT[] DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users"
    ON public.subscription_plans
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all access to admins (handled via a separate admin_users check)
CREATE POLICY "Allow all access to admins"
    ON public.subscription_plans
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
        )
    );

-- Insert default plans based on SUBSCRIPTION_PLANS constants
INSERT INTO public.subscription_plans (id, name, description, monthly_price, yearly_price, features, limits, is_popular)
VALUES 
('free', 'Free', 'Perfect for beginners and hobbyists', 0, 0, 
 ARRAY['Up to 3 scripts', '25 AI credits (starter)', 'Basic export formats', 'Community support'],
 '{"scripts": 3, "aiCreditsPerMonth": 25, "collaborators": 0, "exports": 5}', false),
('pro', 'Professional', 'For serious scriptwriters and creators', 19, 190,
 ARRAY['Unlimited scripts', '100 AI credits / month', 'Advanced export options', 'Real-time collaboration (up to 5)', 'Priority support'],
 '{"scripts": -1, "aiCreditsPerMonth": 100, "collaborators": 5, "exports": -1}', true),
('enterprise', 'Enterprise', 'Custom solutions for teams and studios', 49, 490,
 ARRAY['Everything in Professional', 'Unlimited AI credits', 'Unlimited collaborators', 'Custom templates', 'Dedicated support'],
 '{"scripts": -1, "aiCreditsPerMonth": -1, "collaborators": -1, "exports": -1}', false)
ON CONFLICT (id) DO NOTHING;
