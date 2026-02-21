-- Check if user_id is nullable in script_comments
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'script_comments' AND column_name = 'user_id';
