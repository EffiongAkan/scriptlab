-- ENABLE GUEST COMMENTING
-- 1. Make user_id nullable to allow guests
ALTER TABLE public.script_comments ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest_name column to identify guest users
ALTER TABLE public.script_comments ADD COLUMN IF NOT EXISTS guest_name text;

-- 3. Update RLS policies to allow public (anon) to insert comments on shared scripts
-- Note: This requires careful policy design. For now, we allow if the script is shared publicly.
-- We'll assume a "public" policy for now or that the user is authenticated anonymously.

-- Let's create a specific policy for shared script comments if needed, but for now
-- we just need the schema change.
