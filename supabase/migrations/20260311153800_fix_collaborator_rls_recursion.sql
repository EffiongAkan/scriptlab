-- ============================================================================
-- EMERGENCY FIX: Infinite recursion in script_collaborators RLS policy
--
-- Root cause: The previous migration created a "Owners and admins can manage
-- collaborator records" FOR ALL policy that queries script_collaborators from
-- within a script_collaborators RLS policy — causing infinite recursion.
--
-- Solution: Remove the self-referential admin check. Use only script ownership
-- (scripts table) for the management policy - no recursion possible.
-- ============================================================================

-- Drop the policy that is causing infinite recursion
DROP POLICY IF EXISTS "Owners and admins can manage collaborator records" ON public.script_collaborators;

-- Replace with a safe non-recursive version: only allowed if you OWN the script
CREATE POLICY "Script owners can manage all collaborator records"
  ON public.script_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_collaborators.script_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_collaborators.script_id
        AND s.user_id = auth.uid()
    )
  );
