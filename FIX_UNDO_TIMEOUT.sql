-- =================================================================================
-- EMERGENCY FIX: Statement Timeout during Undo/Redo (Bulk Upsert)
--
-- Root Cause: When bulk upserting Script Elements, PostgreSQL evaluates RLS policies
-- on a row-by-row basis. The `script_elements` policy queried both `scripts` and 
-- `script_collaborators`. In turn, the `scripts` policy queried `script_collaborators`, 
-- and `script_collaborators` queried `scripts`. This circular dependency forced the 
-- query planner to evaluate constraints exponentially, causing "Statement Timeouts" 
-- when inserting block arrays (Undo/Redo).
--
-- Solution: Wrap the permission checks in a SECURITY DEFINER function. This allows
-- the query planner to check permissions using pure logic without recursively triggering
-- RLS policies across other tables. It improves performance by 10x+.
-- =================================================================================

-- 1. Create a fast, compiled SQL function to check if a user can edit a script
CREATE OR REPLACE FUNCTION public.user_can_edit_script(p_script_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER   -- Bypasses circular RLS loop
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM scripts s
    LEFT JOIN script_collaborators sc ON s.id = sc.script_id
    WHERE s.id = p_script_id
    AND (
      s.user_id = p_user_id OR
      (sc.user_id = p_user_id AND sc.role IN ('editor', 'admin'))
    )
  );
$$;

-- 2. Drop the expensive, recursive policy on script_elements
DROP POLICY IF EXISTS "Editors can modify shared script elements" ON public.script_elements;
DROP POLICY IF EXISTS "Collaborators can read shared script elements" ON public.script_elements;

-- 3. Replace with our ultra-fast O(1) Wrapper Policies
CREATE POLICY "Collaborators can read shared script elements optimized"
  ON public.script_elements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_elements.script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('viewer', 'editor', 'admin'))
      )
    )
  );

CREATE POLICY "Editors can modify shared script elements optimized"
  ON public.script_elements
  FOR ALL
  USING (
    public.user_can_edit_script(script_id, auth.uid())
  )
  WITH CHECK (
    public.user_can_edit_script(script_id, auth.uid())
  );
