-- FIX COLLABORATOR WRITE PERMISSIONS
-- The previous policies only allowed READ access for shared scripts.
-- We need to allow WRITE access (INSERT, UPDATE, DELETE) for collaborators.

-- =====================================================================
-- 1. SCRIPT ELEMENTS (The main sync error fix)
-- =====================================================================

-- Allow collaborators to INSERT new elements
DROP POLICY IF EXISTS "auth_insert_elements_via_share" ON public.script_elements;
CREATE POLICY "auth_insert_elements_via_share"
ON public.script_elements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_scripts 
    WHERE shared_scripts.script_id = script_elements.script_id 
    AND shared_scripts.user_id = auth.uid()
    AND shared_scripts.access_level IN ('editor', 'co_author', 'admin')
  )
);

-- Allow collaborators to UPDATE existing elements
DROP POLICY IF EXISTS "auth_update_elements_via_share" ON public.script_elements;
CREATE POLICY "auth_update_elements_via_share"
ON public.script_elements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts 
    WHERE shared_scripts.script_id = script_elements.script_id 
    AND shared_scripts.user_id = auth.uid()
    AND shared_scripts.access_level IN ('editor', 'co_author', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_scripts 
    WHERE shared_scripts.script_id = script_elements.script_id 
    AND shared_scripts.user_id = auth.uid()
    AND shared_scripts.access_level IN ('editor', 'co_author', 'admin')
  )
);

-- Allow collaborators to DELETE elements
DROP POLICY IF EXISTS "auth_delete_elements_via_share" ON public.script_elements;
CREATE POLICY "auth_delete_elements_via_share"
ON public.script_elements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts 
    WHERE shared_scripts.script_id = script_elements.script_id 
    AND shared_scripts.user_id = auth.uid()
    AND shared_scripts.access_level IN ('editor', 'co_author', 'admin')
  )
);

-- =====================================================================
-- 2. SCRIPT COMMENTS (Ensure they can comment too)
-- =====================================================================

-- Allow collaborators to INSERT comments
DROP POLICY IF EXISTS "auth_insert_comments_via_share" ON public.script_comments;
CREATE POLICY "auth_insert_comments_via_share"
ON public.script_comments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_scripts 
    WHERE shared_scripts.script_id = script_comments.script_id 
    AND shared_scripts.user_id = auth.uid()
  )
);

-- Allow collaborators to UPDATE their own comments
DROP POLICY IF EXISTS "auth_update_own_comments" ON public.script_comments;
CREATE POLICY "auth_update_own_comments"
ON public.script_comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow collaborators to DELETE their own comments
DROP POLICY IF EXISTS "auth_delete_own_comments" ON public.script_comments;
CREATE POLICY "auth_delete_own_comments"
ON public.script_comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================================
-- 3. VERIFICATION
-- =====================================================================
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('script_elements', 'script_comments') 
  AND policyname LIKE '%share%'
ORDER BY tablename, policyname;
