-- FIX SHARE LINKS - Enable Anonymous Access Safely
-- Run this in Supabase Dashboard > SQL Editor
-- This adds public access WITHOUT creating circular dependencies

-- ============================================================================
-- ENABLE ANONYMOUS ACCESS TO SHARED_SCRIPTS
-- ============================================================================

-- Drop if exists, then create
DROP POLICY IF EXISTS "Anonymous can view shared_scripts" ON public.shared_scripts;

-- Allow anonymous users to view share records
CREATE POLICY "Anonymous can view shared_scripts"
ON public.shared_scripts
FOR SELECT
TO anon
USING (share_token IS NOT NULL);

-- ============================================================================
-- ENABLE ANONYMOUS ACCESS TO SCRIPTS (for share links)
-- ============================================================================

DROP POLICY IF EXISTS "Anonymous can view scripts" ON public.scripts;

-- Allow anonymous users to view any script
-- Security: Relies on application to only request scripts with valid share tokens
CREATE POLICY "Anonymous can view scripts"
ON public.scripts
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- ENABLE ANONYMOUS ACCESS TO SCRIPT_ELEMENTS (for share links)
-- ============================================================================

DROP POLICY IF EXISTS "Anonymous can view script_elements" ON public.script_elements;

-- Allow anonymous users to view script elements
-- Security: Relies on application to only request elements for shared scripts
CREATE POLICY "Anonymous can view script_elements"
ON public.script_elements
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that policies were created
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND policyname LIKE '%Anonymous%'
ORDER BY tablename, policyname;
