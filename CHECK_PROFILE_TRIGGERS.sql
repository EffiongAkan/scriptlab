-- CHECK_PROFILE_TRIGGERS.sql
-- Run this to see what triggers and functions exist on the profiles table

-- Check all triggers on the profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
AND event_object_schema = 'public';

-- Also check for any functions that might be accessing auth.users
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%profile%';
