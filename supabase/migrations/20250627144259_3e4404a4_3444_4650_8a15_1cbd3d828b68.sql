
-- Fix the admin_users RLS policies to avoid circular dependencies and allow initial admin creation
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Users can insert own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin records" ON public.admin_users;

-- Create simplified policies that allow initial admin bootstrap
-- Allow any authenticated user to insert their own admin record (for initial setup)
CREATE POLICY "Allow admin self-registration" ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to view their own admin record
CREATE POLICY "Users can view own admin status" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow existing admins to view all admin records
CREATE POLICY "Admins can view all admin records" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.admin_users a 
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

-- Allow existing admins to update admin records
CREATE POLICY "Admins can manage admin records" ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users a 
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

-- Update the is_admin function to be more reliable
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = COALESCE($1, auth.uid()) AND is_active = true
  );
$$;

-- Create a function to check if any admin exists (for bootstrap)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE is_active = true
  );
$$;
