
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin creation" ON public.admin_users;

-- Create new policies that don't cause recursion
-- Allow users to view their own admin record
CREATE POLICY "Users can view own admin record" ON public.admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to insert their own admin record
CREATE POLICY "Users can insert own admin record" ON public.admin_users
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow existing admins to view all admin records (using a simple subquery instead of the function)
CREATE POLICY "Admins can view all admin records" ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR user_id = auth.uid()
  );

-- Allow existing admins to update admin records
CREATE POLICY "Admins can update admin records" ON public.admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Update the is_admin function to use a more direct approach
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user BOOLEAN := FALSE;
BEGIN
  -- Temporarily disable RLS for this function
  SET LOCAL row_security = off;
  
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = $1 AND is_active = true
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$;
