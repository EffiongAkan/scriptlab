-- ============================================================================
-- Fix: Auto-create in-app notifications on script invitation insert
-- Root cause: Client-side profiles.email lookup fails silently because
--             profiles.email is optional and often NULL.
-- Solution: DB trigger looks up invitee via auth.users.email (always set)
-- ============================================================================

-- STEP 1: Ensure the realtime publication includes script_invitations
-- so the client's channel subscription actually fires.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'script_invitations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.script_invitations;
  END IF;
END;
$$;

-- STEP 2: Also ensure notifications table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- STEP 3: Create the trigger function that auto-notifies invitee
CREATE OR REPLACE FUNCTION public.handle_new_script_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitee_id  UUID;
  v_script_title TEXT;
BEGIN
  -- Only run on new pending invitations
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  -- Look up the invitee's auth user ID by email (auth.users.email is always set)
  SELECT id INTO v_invitee_id
  FROM auth.users
  WHERE email = NEW.invitee_email
  LIMIT 1;

  -- If the invitee doesn't have an account yet, nothing to notify
  IF v_invitee_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the script title
  SELECT title INTO v_script_title
  FROM public.scripts
  WHERE id = NEW.script_id
  LIMIT 1;

  -- Insert the notification for the invitee
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    read
  ) VALUES (
    v_invitee_id,
    'New Collaboration Invitation',
    'You''ve been invited to collaborate on "' || COALESCE(v_script_title, 'a script') || '" as ' || COALESCE(NEW.role, 'editor'),
    'invitation',
    '/dashboard',
    false
  );

  -- Also backfill the invitee_id on the invitation row for easier lookups
  UPDATE public.script_invitations
  SET invitee_id = v_invitee_id
  WHERE id = NEW.id AND invitee_id IS NULL;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then create fresh
DROP TRIGGER IF EXISTS on_script_invitation_created ON public.script_invitations;

CREATE TRIGGER on_script_invitation_created
  AFTER INSERT ON public.script_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_script_invitation();


-- STEP 4: Create a trigger that notifies the INVITER when invite is accepted
CREATE OR REPLACE FUNCTION public.handle_invitation_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_script_title TEXT;
  v_invitee_name TEXT;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF OLD.status = NEW.status OR NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  -- Get script title
  SELECT title INTO v_script_title
  FROM public.scripts
  WHERE id = NEW.script_id
  LIMIT 1;

  -- Get invitee display name (prefer username, fall back to email)
  SELECT COALESCE(p.username, au.email) INTO v_invitee_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.email = NEW.invitee_email
  LIMIT 1;

  -- Notify the inviter
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    read
  ) VALUES (
    NEW.inviter_id,
    'Invitation Accepted',
    COALESCE(v_invitee_name, NEW.invitee_email) || ' accepted your invitation to collaborate on "' || COALESCE(v_script_title, 'your script') || '"',
    'collaboration',
    '/editor/' || NEW.script_id::text,
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invitation_status_changed ON public.script_invitations;

CREATE TRIGGER on_invitation_status_changed
  AFTER UPDATE OF status ON public.script_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_accepted();


-- STEP 5: Fix the invitee lookup RLS policy on script_invitations.
-- The existing policy uses auth.users subquery which is fine, but let's
-- also ensure invitees can INSERT into script_collaborators when accepting.
DROP POLICY IF EXISTS "Invitees can insert themselves as collaborators" ON public.script_collaborators;

CREATE POLICY "Invitees can insert themselves as collaborators"
  ON public.script_collaborators
  FOR INSERT
  WITH CHECK (
    -- Either the script owner OR someone who has a valid accepted/pending invite
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.scripts s WHERE s.id = script_id AND s.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.script_invitations si
        WHERE si.script_id = script_collaborators.script_id
          AND si.invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND si.status IN ('pending', 'accepted')
      )
    )
  );

-- STEP 6: Grant EXECUTE permission so the trigger runs properly
GRANT EXECUTE ON FUNCTION public.handle_new_script_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_invitation_accepted() TO authenticated;
