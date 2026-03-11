-- Fix Activity Triggers to gracefully handle Script Deletions
-- This prevents the "foreign key violation" when the database automatically removes
-- script elements, collaborators, and comments while the main script is being deleted.

CREATE OR REPLACE FUNCTION public.record_script_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_script_id UUID;
BEGIN
  v_script_id := COALESCE(NEW.script_id, OLD.script_id);

  -- CRITICAL FIX: Only log activity if the script actually still exists.
  -- This prevents foreign key violations during cascading deletes.
  IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.scripts WHERE id = v_script_id) THEN
    INSERT INTO public.script_activities (
      script_id,
      user_id,
      action_type, 
      details
    ) VALUES (
      v_script_id,
      auth.uid(),
      TG_OP,
      jsonb_build_object(
        'element_id', COALESCE(NEW.id, OLD.id),
        'element_type', COALESCE(NEW.type, OLD.type)
      )
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update collaborator join trigger
CREATE OR REPLACE FUNCTION public.record_collaborator_join()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.scripts WHERE id = NEW.script_id) THEN
    INSERT INTO public.script_activities (script_id, user_id, action_type, details)
    VALUES (
      NEW.script_id, 
      NEW.user_id, 
      'join',
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update collaborator leave trigger
CREATE OR REPLACE FUNCTION public.record_collaborator_leave()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.scripts WHERE id = OLD.script_id) THEN
    INSERT INTO public.script_activities (script_id, user_id, action_type, details)
    VALUES (
      OLD.script_id, 
      OLD.user_id, 
      'leave', 
      jsonb_build_object('role', OLD.role)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment trigger
CREATE OR REPLACE FUNCTION public.record_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.scripts WHERE id = NEW.script_id) THEN
    INSERT INTO public.script_activities (script_id, user_id, action_type, details)
    VALUES (
      NEW.script_id, 
      NEW.user_id, 
      'commenting', 
      jsonb_build_object('comment_id', NEW.id, 'content', NEW.content)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
