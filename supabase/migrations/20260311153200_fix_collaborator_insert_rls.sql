-- ============================================================================
-- Fix: "There was a problem accepting the invitation" RLS conflict
--
-- Root cause: The old "Admins can manage collaborators" policy is FOR ALL with
-- a restrictive WITH CHECK. In Postgres, ALL permissive policies' WITH CHECK
-- clauses must pass for a row to be inserted. This means the old admin-only
-- INSERT check conflicts with the newer "Invitees can insert themselves" policy.
--
-- Solution: Replace the broad FOR ALL admin policy with separate granular
-- SELECT, UPDATE, and DELETE policies that don't interfere with INSERT.
-- Keep the invitee INSERT policy clean and standalone.
-- ============================================================================

-- Step 1: Drop all conflicting policies on script_collaborators
DROP POLICY IF EXISTS "Admins can manage collaborators" ON public.script_collaborators;
DROP POLICY IF EXISTS "Invitees can insert themselves as collaborators" ON public.script_collaborators;
DROP POLICY IF EXISTS "Script collaborators can see their collaborations" ON public.script_collaborators;
DROP POLICY IF EXISTS "Users can view collaborations for their scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "Users can view their collaborations" ON public.script_collaborators;

-- Step 2: Clean SELECT policy — users can see their own records or records
-- for scripts they own
CREATE POLICY "Collaborators can view their memberships"
  ON public.script_collaborators
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_collaborators.script_id
        AND s.user_id = auth.uid()
    )
  );

-- Step 3: Clean INSERT policy — either owner adding collaborators, OR invitee
-- self-registering after receiving a valid (pending or accepted) invitation
CREATE POLICY "Script owners and invitees can insert collaborators"
  ON public.script_collaborators
  FOR INSERT
  WITH CHECK (
    -- Invitee inserting themselves (must match auth.uid())
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.script_invitations si
        WHERE si.script_id = script_collaborators.script_id
          AND si.invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND si.status IN ('pending', 'accepted')
      )
    )
    OR
    -- Script owner adding collaborators directly
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_collaborators.script_id
        AND s.user_id = auth.uid()
    )
  );

-- Step 4: Owners and admins can update/delete collaborator records
CREATE POLICY "Owners and admins can manage collaborator records"
  ON public.script_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_collaborators.script_id
        AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.script_collaborators sc
      WHERE sc.script_id = script_collaborators.script_id
        AND sc.user_id = auth.uid()
        AND sc.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_collaborators.script_id
        AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.script_collaborators sc
      WHERE sc.script_id = script_collaborators.script_id
        AND sc.user_id = auth.uid()
        AND sc.role = 'admin'
    )
  );
