-- FINAL FIX FOR GUEST COMMENTING
-- Use this script to resolve all permission issues at once.

-- 1. DATABASE STRUCTURE: Ensure guests can actually be stored
ALTER TABLE public.script_comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.script_comments ADD COLUMN IF NOT EXISTS guest_name text;

-- 2. SHARED SCRIPTS ACCESS: Guests must be able to "see" the share record to verify it
ALTER TABLE public.shared_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read shared scripts" ON public.shared_scripts;
CREATE POLICY "Public can read shared scripts"
ON public.shared_scripts
FOR SELECT
TO public
USING (true);

-- 3. COMMENTS ACCESS: Allow guests to view and add comments if verify passes
ALTER TABLE public.script_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can view comments on shared scripts" ON public.script_comments;
CREATE POLICY "Guests can view comments on shared scripts"
ON public.script_comments
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts ss
    WHERE ss.script_id = script_comments.script_id
    AND (ss.expires_at IS NULL OR ss.expires_at > now())
  )
);

DROP POLICY IF EXISTS "Guests can add comments to shared scripts" ON public.script_comments;
CREATE POLICY "Guests can add comments to shared scripts"
ON public.script_comments
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_scripts ss
    WHERE ss.script_id = script_comments.script_id
    AND (ss.expires_at IS NULL OR ss.expires_at > now())
  )
);
