-- Add foreign key constraint to profiles table if it doesn't exist
ALTER TABLE public.script_versions
  DROP CONSTRAINT IF EXISTS script_versions_created_by_fkey;

ALTER TABLE public.script_versions
  ADD CONSTRAINT script_versions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
