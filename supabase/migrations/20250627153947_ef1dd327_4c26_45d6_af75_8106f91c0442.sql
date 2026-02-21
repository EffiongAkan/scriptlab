
-- Fix the infinite recursion in admin_users RLS policies
DROP POLICY IF EXISTS "Allow admin self-registration" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin records" ON public.admin_users;

-- Create new simplified policies that don't cause recursion
-- Allow any authenticated user to view their own admin record
CREATE POLICY "Users can view own admin record" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow any authenticated user to insert their own admin record (for first admin setup)
CREATE POLICY "Users can create own admin record" ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow existing admins to view all records (using a direct subquery to avoid function calls)
CREATE POLICY "Existing admins can view all records" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.admin_users existing_admin
      WHERE existing_admin.user_id = auth.uid() 
      AND existing_admin.is_active = true
    )
  );

-- Allow existing admins to update records
CREATE POLICY "Existing admins can update records" ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users existing_admin
      WHERE existing_admin.user_id = auth.uid() 
      AND existing_admin.is_active = true
    )
  );

-- Update the admin_exists function to be more direct
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

-- Update the is_admin function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = COALESCE($1, auth.uid()) 
    AND is_active = true
  );
$$;
