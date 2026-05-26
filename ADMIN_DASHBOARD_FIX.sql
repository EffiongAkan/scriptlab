-- ====================================================================================
-- FIX: Admin Dashboard Issues + Subscription Plans Data Update
-- Run this in your Supabase SQL Editor
-- ====================================================================================

-- 1. Fix the `is_super_admin` function — level was checked >= 100 but Super Admin role is level 10
-- This fixes: "Access Denied" on Admin Invites tab, "new row violates RLS" errors on Settings/toggles
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = is_super_admin.user_id
        AND admin_users.is_active = true
        AND role_id IN (SELECT id FROM public.admin_roles WHERE level >= 10)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update the Professional Plan to reflect the new promotional pricing and features
UPDATE public.subscription_plans
SET 
  monthly_price = 15.00,
  yearly_price = 150.00,
  features = ARRAY[
      '700 AI credits / month (9,500 / year)',
      'Unlimited scripts',
      'Script generation',
      'Analyze video (create scripts from video)',
      'Real-time collaboration',
      'Script Analysis',
      'Modify script with AI',
      'Advanced Export options',
      'Version control',
      'Priority support'
  ],
  limits = '{"scripts": -1, "aiCreditsPerMonth": 700, "aiCreditsYearly": 9500, "collaborators": 5, "exports": -1}'::jsonb
WHERE id = 'pro';

-- 3. Update the Free plan limits (scripts: 2 as shown in UI)
UPDATE public.subscription_plans
SET 
  limits = '{"scripts": 2, "aiCreditsPerMonth": 25, "collaborators": 0, "exports": 5}'::jsonb,
  features = ARRAY[
      'Up to 2 scripts',
      '25 AI credits (starter)',
      'Basic export formats',
      'Community support'
  ]
WHERE id = 'free';

-- 4. Ensure the Super Admin role exists with the correct level and permissions
INSERT INTO public.admin_roles (name, level, color, permissions, can_manage_users, can_manage_subscriptions, can_manage_system, can_view_analytics, can_send_notifications, can_manage_admins)
VALUES (
  'Super Admin', 
  10, 
  'red', 
  '["all"]', 
  true, true, true, true, true, true
) ON CONFLICT (name) DO UPDATE SET
  level = 10,
  can_manage_system = true,
  can_manage_admins = true;

-- 5. Ensure your admin accounts have the Super Admin role
DO $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  SELECT id INTO super_admin_role_id FROM public.admin_roles WHERE name = 'Super Admin' LIMIT 1;
  
  IF super_admin_role_id IS NOT NULL THEN
    UPDATE public.admin_users 
    SET role_id = super_admin_role_id 
    WHERE email IN ('pelicanink2025@gmail.com', 'uploadakan@gmail.com');
  END IF;
END $$;
