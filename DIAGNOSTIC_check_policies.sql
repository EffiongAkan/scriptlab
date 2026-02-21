-- DIAGNOSTIC: Check Current RLS Policies
-- Run this FIRST to see what policies exist

-- Check all policies for scripts, script_elements, and shared_scripts
SELECT 
  tablename,
  policyname,
  roles,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%nonymous%' OR policyname LIKE '%anon%' THEN '✓ ANONYMOUS'
    WHEN policyname LIKE '%ser%' THEN '✓ USER'
    ELSE 'OTHER'
  END as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('scripts', 'script_elements', 'shared_scripts')
ORDER BY tablename, policyname;

-- If you see NO policies with "Anonymous" or roles containing "anon", 
-- that means the FIX_SHARE_LINKS.sql did NOT run successfully
-- or the policies were not created.
