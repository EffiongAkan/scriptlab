-- VERIFY SECURITY FIX
-- Run this script in the Supabase Dashboard to verify RLS is enabled and policies are active.

SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('scripts', 'messages', 'mentions', 'comments', 'script_comments', 'edit_notifications', 'ai_rate_limits')
ORDER BY tablename;

-- Check policies for these tables
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('scripts', 'messages', 'mentions', 'comments', 'script_comments', 'edit_notifications', 'ai_rate_limits')
ORDER BY tablename, policyname;

-- Simulation: Check if anonymous user can see anything
-- This is just a conceptual check; in Supabase Dashboard you are usually 'service_role' or 'postgres' which bypasses RLS.
-- To truly test, you must use the 'anon' or 'authenticated' role.
