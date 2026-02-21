-- REMOVE_SYNC_PROFILE_EMAIL.sql
-- This removes the problematic function that's accessing auth.users

-- Drop any triggers that might be using this function
DROP TRIGGER IF EXISTS sync_email_trigger ON public.profiles;
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;
DROP TRIGGER IF EXISTS update_profile_email ON public.profiles;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.sync_profile_email() CASCADE;

-- That's it! The function is gone and can't access auth.users anymore
-- The client code will handle profile updates without needing this trigger
