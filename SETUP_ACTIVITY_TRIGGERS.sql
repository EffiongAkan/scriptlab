-- SETUP ACTIVITY TRIGGERS
-- automatically records activities when script_elements are modified

-- 1. Create the function that records the activity
CREATE OR REPLACE FUNCTION public.record_script_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_script_id UUID;
  v_user_id UUID;
  v_action_type TEXT;
  v_details JSONB;
BEGIN
  -- Determine operation type and data
  IF (TG_OP = 'INSERT') THEN
    v_script_id := NEW.script_id;
    v_action_type := 'editing'; -- Generic editing
    v_details := jsonb_build_object('element_type', NEW.type, 'element_id', NEW.id, 'action', 'insert');
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Skip recording activity if only position or timestamps changed (prevents bulk sync spam)
    IF (OLD.content = NEW.content AND OLD.type = NEW.type) THEN
      RETURN NULL;
    END IF;

    v_script_id := NEW.script_id;
    v_action_type := 'editing';
    v_details := jsonb_build_object('element_type', NEW.type, 'element_id', NEW.id, 'action', 'update');
  ELSIF (TG_OP = 'DELETE') THEN
    v_script_id := OLD.script_id;
    v_action_type := 'editing';
    v_details := jsonb_build_object('element_type', OLD.type, 'element_id', OLD.id, 'action', 'delete');
  END IF;

  -- Get current user ID (if available in context, otherwise it might be null/system)
  v_user_id := auth.uid();

  -- Insert into script_activities
  -- We use a "coalesce" for script_id to handle potential edge cases (though unlikely with FKs)
  IF v_script_id IS NOT NULL THEN
    INSERT INTO public.script_activities (script_id, user_id, action_type, details)
    VALUES (v_script_id, v_user_id, v_action_type, v_details);
  END IF;

  RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on script_elements
DROP TRIGGER IF EXISTS on_script_element_change ON public.script_elements;

CREATE TRIGGER on_script_element_change
AFTER INSERT OR UPDATE OR DELETE ON public.script_elements
FOR EACH ROW
EXECUTE FUNCTION public.record_script_activity();

-- 3. Also trigger for COMMENTS
CREATE OR REPLACE FUNCTION public.record_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.script_activities (script_id, user_id, action_type, details)
  VALUES (
    NEW.script_id, 
    NEW.user_id, 
    'commenting', 
    jsonb_build_object('comment_id', NEW.id, 'content', NEW.content)
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_script_comment_add ON public.script_comments;

CREATE TRIGGER on_script_comment_add
AFTER INSERT ON public.script_comments
FOR EACH ROW
EXECUTE FUNCTION public.record_comment_activity();
