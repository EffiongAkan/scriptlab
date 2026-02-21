-- COMPLETE FIX FOR GUEST ACCESS
-- 1. Allow public to read the shared_scripts table (Essential for verifying tokens)
CREATE POLICY "Public read shared scripts"
ON public.shared_scripts
FOR SELECT
TO public
USING (true);

-- 2. Allow public to read/insert comments if linked to a valid shared script
-- (Dropping previous policies if they exist to avoid conflict)
DROP POLICY IF EXISTS "Guests can view comments on shared scripts" ON public.script_comments;
DROP POLICY IF EXISTS "Guests can add comments to shared scripts" ON public.script_comments;

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
