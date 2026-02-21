-- VERIFY POLICIES AND TABLES
-- Check if the collaboration policies are active
-- Check if script_activities exists
-- Check if notifications table exists

SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'script_elements' 
  AND policyname LIKE '%auth_%'
ORDER BY policyname;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('script_activities', 'notifications');
