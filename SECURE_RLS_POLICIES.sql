-- SECURE RLS POLICIES (DEPLOYMENT READY)
-- Replaces temporary debug access with strict Owner/Collaborator checks.

-- 1. Drop the debug "Open Access" policy
DROP POLICY IF EXISTS "debug_auth_all_elements" ON public.script_elements;
DROP POLICY IF EXISTS "debug_auth_all_comments" ON public.script_comments;

-- 2. SCRIPT ELEMENTS: Secure Write Access
-- ALLOW INSERT/UPDATE/DELETE only if:
--   a) User is the Owner of the script
--   b) User is a listed Collaborator for the script

CREATE POLICY "auth_manage_elements_owner_collab"
ON public.script_elements
FOR ALL
TO authenticated
USING (
  -- Check if user is owner
  exists (
    SELECT 1 FROM public.scripts s
    WHERE s.id = script_elements.script_id
    AND s.user_id = auth.uid()
  )
  OR
  -- Check if user is a collaborator
  exists (
    SELECT 1 FROM public.script_collaborators sc
    WHERE sc.script_id = script_elements.script_id
    AND sc.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same checks for INSERT/UPDATE
  exists (
    SELECT 1 FROM public.scripts s
    WHERE s.id = script_elements.script_id
    AND s.user_id = auth.uid()
  )
  OR
  exists (
    SELECT 1 FROM public.script_collaborators sc
    WHERE sc.script_id = script_elements.script_id
    AND sc.user_id = auth.uid()
  )
);

-- 3. SCRIPT COMMENTS: Secure Access
-- Users can CREATE comments on scripts they have access to.
-- Users can EDIT/DELETE *only their own* comments.

CREATE POLICY "auth_create_comments_if_collab"
ON public.script_comments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Can comment if you can view the script (Owner or Collaborator)
  exists (
    SELECT 1 FROM public.scripts s
    WHERE s.id = script_comments.script_id
    AND s.user_id = auth.uid()
  )
  OR
  exists (
    SELECT 1 FROM public.script_collaborators sc
    WHERE sc.script_id = script_comments.script_id
    AND sc.user_id = auth.uid()
  )
);

CREATE POLICY "auth_manage_own_comments"
ON public.script_comments
FOR UPDATE
TO authenticated
USING ( user_id = auth.uid() ) -- Can only edit own comments
WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "auth_delete_own_comments"
ON public.script_comments
FOR DELETE
TO authenticated
USING ( user_id = auth.uid() ); -- Can only delete own comments
