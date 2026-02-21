
-- 1. Check if public can read shared_scripts (REQUIRED for comment validation)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'shared_scripts';

-- 2. Check if user_id is nullable (REQUIRED for guest comments)
SELECT 
    column_name, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'script_comments' AND column_name = 'user_id';

-- 3. Check if RLS is enabled on shared_scripts
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'shared_scripts';
