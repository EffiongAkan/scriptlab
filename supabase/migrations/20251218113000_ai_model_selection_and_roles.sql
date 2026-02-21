
-- ====================================================================================
-- AI MODEL SELECTION AND ENHANCED ADMIN ROLES
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

-- 4. Create is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_super BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.admin_roles ar ON au.role_id = ar.id
    WHERE au.user_id = $1 AND au.is_active = true AND ar.level >= 10
  ) INTO is_super;
  
  RETURN is_super;
END;
$$;

-- 5. Add AI Model settings to system_settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('active_ai_model', '"deepseek-chat"', 'The currently active AI model ID'),
  ('active_ai_provider', '"deepseek"', 'The currently active AI provider (deepseek, openai, anthropic, xai)'),
  ('openai_api_key', '""', 'API Key for OpenAI'),
  ('anthropic_api_key', '""', 'API Key for Anthropic'),
  ('xai_api_key', '""', 'API Key for xAI')
ON CONFLICT (key) DO NOTHING;

-- 6. Update RLS for system_settings to allow super admins to manage sensitive keys
-- (Existing policy "Admins can manage system settings" is already present, but we might want to restrict keys like API keys to super admins)
DROP POLICY IF EXISTS "Super admins can manage sensitive settings" ON public.system_settings;
CREATE POLICY "Super admins can manage sensitive settings" ON public.system_settings
  FOR ALL
  USING (public.is_super_admin());

-- 7. Update existing admin_users to have the Super Admin role if they were 'admin'
DO $$
DECLARE
  super_admin_id UUID;
BEGIN
  SELECT id INTO super_admin_id FROM public.admin_roles WHERE name = 'Super Admin' LIMIT 1;
  
  IF super_admin_id IS NOT NULL THEN
    UPDATE public.admin_users 
    SET role_id = super_admin_id 
    WHERE role = 'admin' AND role_id IS NULL;
  END IF;
END $$;
