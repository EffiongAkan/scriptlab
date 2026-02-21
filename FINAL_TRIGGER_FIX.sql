
-- FINAL FIX for script activity trigger
-- Root cause of "Save Failed": The previous trigger tried to access NEW record during DELETE operation.
-- DELETE operations do not have a NEW record, causing the function to crash.
-- This script safely handles INSERT, UPDATE, and DELETE.

CREATE OR REPLACE FUNCTION record_script_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_script_id UUID;
  v_user_id UUID;
  v_action_type TEXT;
  v_details JSONB;
BEGIN
  -- Determine operation type and safely access NEW/OLD
  IF (TG_OP = 'INSERT') THEN
    v_script_id := NEW.script_id;
    v_action_type := 'editing';
    v_details := jsonb_build_object('element_type', NEW.type, 'element_id', NEW.id, 'action', 'insert');
  ELSIF (TG_OP = 'UPDATE') THEN
    v_script_id := NEW.script_id;
    v_action_type := 'editing';
    v_details := jsonb_build_object('element_type', NEW.type, 'element_id', NEW.id, 'action', 'update');
  ELSIF (TG_OP = 'DELETE') THEN
    v_script_id := OLD.script_id; -- MUST use OLD for DELETE
    v_action_type := 'editing';
    v_details := jsonb_build_object('element_type', OLD.type, 'element_id', OLD.id, 'action', 'delete');
  END IF;

  -- Get current user ID
  v_user_id := auth.uid();

  -- Only log if we have a valid context
  IF v_script_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO public.script_activities (
      script_id, 
      user_id, 
      action_type, 
      details
    ) VALUES (
      v_script_id, 
      v_user_id, 
      v_action_type, 
      v_details
    );
  END IF;

  -- Return value based on operation
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
