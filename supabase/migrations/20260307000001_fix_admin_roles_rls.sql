-- Enable full CRUD operations for authorized admins on the admin_roles table

BEGIN;

-- Allow Super Admins/Admins to insert new roles
CREATE POLICY "Admins can create roles" ON public.admin_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Allow Super Admins/Admins to update existing roles
CREATE POLICY "Admins can update roles" ON public.admin_roles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow Super Admins/Admins to delete roles
CREATE POLICY "Admins can delete roles" ON public.admin_roles
  FOR DELETE
  USING (public.is_admin());

COMMIT;
