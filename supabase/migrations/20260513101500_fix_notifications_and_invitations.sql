-- Fix for Notifications RLS and Invitation Permission Denied errors
-- Reverting critical system functions to SECURITY DEFINER

-- 1. FIX: accept_script_invitation (Must be DEFINER to query auth.users)
CREATE OR REPLACE FUNCTION public.accept_script_invitation(p_invitation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_user_id UUID;
  v_existing_collaborator_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Querying auth.users requires SECURITY DEFINER
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Fetch the invitation
  SELECT * INTO v_invitation
  FROM public.script_invitations
  WHERE id = p_invitation_id
    AND invitee_email = v_user_email
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or already processed');
  END IF;

  -- Mark accepted
  UPDATE public.script_invitations
  SET status = 'accepted',
      invitee_id = v_user_id
  WHERE id = p_invitation_id;

  -- Create collaborator entry
  SELECT id INTO v_existing_collaborator_id
  FROM public.script_collaborators
  WHERE script_id = v_invitation.script_id
    AND user_id = v_user_id;

  IF v_existing_collaborator_id IS NULL THEN
    INSERT INTO public.script_collaborators (script_id, user_id, role)
    VALUES (v_invitation.script_id, v_user_id, COALESCE(v_invitation.role, 'editor'));
  ELSE
    UPDATE public.script_collaborators
    SET role = COALESCE(v_invitation.role, role)
    WHERE id = v_existing_collaborator_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'script_id', v_invitation.script_id::text
  );
END;
$$;

-- 2. FIX: handle_new_script_invitation (Trigger function, must be DEFINER)
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
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  -- Look up invitee via auth.users
  SELECT id INTO v_invitee_id
  FROM auth.users
  WHERE email = NEW.invitee_email
  LIMIT 1;

  IF v_invitee_id IS NOT NULL THEN
    -- Get script title
    SELECT title INTO v_script_title FROM public.scripts WHERE id = NEW.script_id LIMIT 1;

    -- Insert notification (bypassing RLS or using DEFINER context)
    INSERT INTO public.notifications (
      user_id, title, message, type, action_url, read
    ) VALUES (
      v_invitee_id,
      'New Collaboration Invitation',
      'You''ve been invited to collaborate on "' || COALESCE(v_script_title, 'a script') || '" as ' || COALESCE(NEW.role, 'editor'),
      'invitation',
      '/dashboard',
      false
    );

    -- Backfill invitee_id
    UPDATE public.script_invitations
    SET invitee_id = v_invitee_id
    WHERE id = NEW.id AND invitee_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. FIX: handle_invitation_accepted (Trigger function)
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
  IF OLD.status = NEW.status OR NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_script_title FROM public.scripts WHERE id = NEW.script_id LIMIT 1;

  SELECT COALESCE(p.username, au.email) INTO v_invitee_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE au.email = NEW.invitee_email
  LIMIT 1;

  INSERT INTO public.notifications (
    user_id, title, message, type, action_url, read
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

-- 4. NOTIFICATIONS RLS: Ensure admins can send broadcasts
-- We check if the user is a super admin before allowing arbitrary inserts
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = is_super_admin.user_id
        AND admin_users.is_active = true
        AND role_id IN (SELECT id FROM public.admin_roles WHERE level >= 100)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the System can create notifications policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    -- Users can create notifications for themselves (e.g. system alerts)
    auth.uid() = user_id
    OR
    -- Super admins can send to anyone (Broadcasts)
    public.is_super_admin(auth.uid())
    OR
    -- Allow system triggers (handled by SECURITY DEFINER functions above)
    -- but for direct client inserts, we check admin status
    (SELECT count(*) FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) > 0
  );

-- Re-grant permissions just in case
GRANT EXECUTE ON FUNCTION public.accept_script_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_script_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_invitation_accepted() TO authenticated;
