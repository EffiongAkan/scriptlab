-- DEBUG: OPEN ACCESS
-- Temporarily allow ALL authenticated users to edit ANY script element.
-- This helps us determine if the previous RLS policy was too strict.

DROP POLICY IF EXISTS "auth_insert_elements_via_share" ON public.script_elements;
DROP POLICY IF EXISTS "auth_update_elements_via_share" ON public.script_elements;
DROP POLICY IF EXISTS "auth_delete_elements_via_share" ON public.script_elements;

-- Create a "catch-all" permissive policy for authenticated users
CREATE POLICY "debug_auth_all_elements"
ON public.script_elements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also for comments
DROP POLICY IF EXISTS "auth_insert_comments_via_share" ON public.script_comments;
DROP POLICY IF EXISTS "auth_update_own_comments" ON public.script_comments;
DROP POLICY IF EXISTS "auth_delete_own_comments" ON public.script_comments;

CREATE POLICY "debug_auth_all_comments"
ON public.script_comments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
