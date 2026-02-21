-- ENHANCE COLLABORATION ACTIVITY LOGGING

-- 1. Trigger for "Invite Accepted" (User added to collaborators)
CREATE OR REPLACE FUNCTION public.record_collaborator_join()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Try to get email for better history (optional, or just store user_id)
  -- We'll just stick to user_id and let frontend resolve it
  
  INSERT INTO public.script_activities (script_id, user_id, action_type, details)
  VALUES (
    NEW.script_id, 
    NEW.user_id, 
    'join', -- Distinct action type for "Invite Accepted"
    jsonb_build_object('role', NEW.role)
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collaborator_added ON public.script_collaborators;

CREATE TRIGGER on_collaborator_added
AFTER INSERT ON public.script_collaborators
FOR EACH ROW
EXECUTE FUNCTION public.record_collaborator_join();

-- 2. Trigger for "User Left" (Removed from collaborators)
CREATE OR REPLACE FUNCTION public.record_collaborator_leave()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.script_activities (script_id, user_id, action_type, details)
  VALUES (
    OLD.script_id, 
    OLD.user_id, 
    'leave', 
    jsonb_build_object('role', OLD.role)
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collaborator_removed ON public.script_collaborators;

CREATE TRIGGER on_collaborator_removed
AFTER DELETE ON public.script_collaborators
FOR EACH ROW
EXECUTE FUNCTION public.record_collaborator_leave();
