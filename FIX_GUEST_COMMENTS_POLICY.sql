-- Allow GUESTS (anon users) to VIEW comments on shared scripts
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

-- Allow GUESTS (anon users) to ADD comments to shared scripts
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
