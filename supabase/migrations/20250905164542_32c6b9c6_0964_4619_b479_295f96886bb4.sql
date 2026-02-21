-- Make the current user an admin for testing
-- Only insert if the admin_users table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_users'
  ) THEN
    INSERT INTO public.admin_users (user_id, created_by, is_active) 
    VALUES ('8704e96c-5ba1-4e1f-b914-f56a3e8cca5e', '8704e96c-5ba1-4e1f-b914-f56a3e8cca5e', true)
    ON CONFLICT (user_id) DO UPDATE SET is_active = true;
  END IF;
END $$;

-- Give the user 100 AI credits for testing
-- Only update if the profiles table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    UPDATE public.profiles 
    SET ai_credits = 100 
    WHERE id = '8704e96c-5ba1-4e1f-b914-f56a3e8cca5e';
  END IF;
END $$;