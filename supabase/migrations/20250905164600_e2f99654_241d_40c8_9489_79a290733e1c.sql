-- Update the current user's profile to add AI credits
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