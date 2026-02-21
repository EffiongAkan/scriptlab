
-- 1. Drop the recursive policies
DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Existing admins can view all records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Existing admins can update records" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin self-registration" ON public.admin_users;
DROP POLICY IF EXISTS "Users can create own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Users can insert own admin record" ON public.admin_users;

-- 2. Update is_admin to be more robust and avoid any potential search path issues
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

-- 3. Update is_super_admin similarly
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

-- 4. Create new non-recursive policies
-- Allow any authenticated user to view their own admin status
CREATE POLICY "Users can view own admin record" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all admin records (Safe because is_admin is SECURITY DEFINER)
CREATE POLICY "Admins can view all admin records" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to manage admin records
CREATE POLICY "Admins can manage admin records" ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow users to insert their own record for initial setup or registration
CREATE POLICY "Users can insert own admin record" ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
