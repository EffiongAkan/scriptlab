-- ====================================================================================
-- SECURE API KEYS & HARDEN SYSTEM SETTINGS
-- ====================================================================================

-- This migration ensures that API keys (keys ending with '_api_key') are NEVER returned
-- to the frontend by restricting the SELECT policy on the system_settings table.
-- Edge Functions bypass RLS because they use the service_role key, so they will
-- still be able to read the keys for server-side logic.

-- 1. Drop existing policies that might be too permissive
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can manage sensitive settings" ON public.system_settings;

-- 2. Create restricted SELECT policy for public/authenticated users
-- Anyone can read settings AS LONG AS they are not API keys.
CREATE POLICY "Public can view non-sensitive settings" ON public.system_settings
  FOR SELECT
  USING (key NOT LIKE '%_api_key');

-- 3. Create restricted UPDATE/INSERT policy for Super Admins
-- Only Super Admins can manage settings, including inserting/updating API keys.
-- The actual reading of API keys is still blocked for them by the SELECT policy above,
-- which enforces a "Write-Only" model in the frontend.
CREATE POLICY "Super admins can manage all settings" ON public.system_settings
  FOR ALL
  USING (public.is_super_admin());

-- Note: The `USING` clause on `FOR ALL` applies to SELECT, UPDATE, and DELETE. 
-- However, for SELECT, policies are combined using OR.
-- Therefore, if `is_super_admin()` is true, they could theoretically SELECT the keys.
-- To enforce strict write-only even for admins on the frontend, we must change this.

-- REVISED POLICIES FOR STRICT FRONTEND WRITE-ONLY:

DROP POLICY IF EXISTS "Super admins can manage all settings" ON public.system_settings;

-- For INSERT, UPDATE, DELETE: Only Super Admins
CREATE POLICY "Super admins can modify settings" ON public.system_settings
  FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update settings" ON public.system_settings
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete settings" ON public.system_settings
  FOR DELETE
  USING (public.is_super_admin());
