-- Fix: Remove updated_at from script_invitations UPDATE — column does not exist on that table
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
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Fetch the invitation — must be pending and addressed to this user
  SELECT * INTO v_invitation
  FROM public.script_invitations
  WHERE id = p_invitation_id
    AND invitee_email = v_user_email
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or already processed');
  END IF;

  -- Mark the invitation accepted (no updated_at column on this table)
  UPDATE public.script_invitations
  SET status = 'accepted',
      invitee_id = v_user_id
  WHERE id = p_invitation_id;

  -- Check if user is already a collaborator
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

GRANT EXECUTE ON FUNCTION public.accept_script_invitation(UUID) TO authenticated;
