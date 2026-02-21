
-- ====================================================================================
-- CONSOLIDATED FIX: Admin Roles, RLS Policies, and Auto-Assignment
-- This migration consolidates all the fixes needed for admin account creation
-- ====================================================================================

-- 1. Create admin_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  color TEXT DEFAULT 'blue',
  permissions JSONB DEFAULT '[]',
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_subscriptions BOOLEAN DEFAULT false,
  can_manage_system BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_send_notifications BOOLEAN DEFAULT false,
  can_manage_admins BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 2. Add role_id to admin_users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users' 
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN role_id UUID REFERENCES public.admin_roles(id);
  END IF;
END $$;

-- 3. Insert default Super Admin role
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

-- 4. Drop any existing recursive policies
DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Existing admins can view all records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Existing admins can update records" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin self-registration" ON public.admin_users;
DROP POLICY IF EXISTS "Users can create own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Users can insert own admin record" ON public.admin_users;

-- 5. Update is_admin function to be robust
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = $1 AND is_active = true
  );
END;
$$;

-- 6. Create is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.admin_roles ar ON au.role_id = ar.id
    WHERE au.user_id = $1 AND au.is_active = true AND ar.level >= 10
  );
END;
$$;

-- 7. Create new non-recursive policies
CREATE POLICY "Users can view own admin record" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin records" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage admin records" ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own admin record" ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 8. Create trigger function to auto-assign Super Admin role
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  -- Only assign role if role_id is NULL
  IF NEW.role_id IS NULL THEN
    -- Get the Super Admin role ID
    SELECT id INTO super_admin_role_id 
    FROM public.admin_roles 
    WHERE name = 'Super Admin' 
    LIMIT 1;
    
    -- Assign it to the new admin user
    IF super_admin_role_id IS NOT NULL THEN
      NEW.role_id := super_admin_role_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Create trigger
DROP TRIGGER IF EXISTS assign_super_admin_role_trigger ON public.admin_users;
CREATE TRIGGER assign_super_admin_role_trigger
  BEFORE INSERT ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_super_admin_role();

-- 10. Backfill existing admin users
DO $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  SELECT id INTO super_admin_role_id 
  FROM public.admin_roles 
  WHERE name = 'Super Admin' 
  LIMIT 1;
  
  IF super_admin_role_id IS NOT NULL THEN
    UPDATE public.admin_users 
    SET role_id = super_admin_role_id 
    WHERE role_id IS NULL;
  END IF;
END $$;

-- 11. Add AI Model settings to system_settings if they don't exist
INSERT INTO public.system_settings (key, value, description) VALUES
  ('active_ai_model', '"deepseek-chat"', 'The currently active AI model ID'),
  ('active_ai_provider', '"deepseek"', 'The currently active AI provider (deepseek, openai, anthropic, xai)'),
  ('openai_api_key', '""', 'API Key for OpenAI'),
  ('anthropic_api_key', '""', 'API Key for Anthropic'),
  ('xai_api_key', '""', 'API Key for xAI'),
  ('deepseek_api_key', '""', 'API Key for DeepSeek')
ON CONFLICT (key) DO NOTHING;

-- 12. Update system_settings RLS policy for super admins
DROP POLICY IF EXISTS "Super admins can manage sensitive settings" ON public.system_settings;
CREATE POLICY "Super admins can manage sensitive settings" ON public.system_settings
  FOR ALL
  USING (public.is_super_admin());
