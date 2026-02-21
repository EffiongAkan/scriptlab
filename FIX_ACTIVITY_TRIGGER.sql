-- Fix the activity trigger to use the correct column name (action_type instead of action)
CREATE OR REPLACE FUNCTION record_script_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log activity if there's an authenticated user
  -- Skip logging for migrations and system operations
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO script_activities (
      script_id,
      user_id,
      action_type, -- Corrected from 'action'
      details
    ) VALUES (
      NEW.script_id,
      auth.uid(),
      TG_OP,
      jsonb_build_object(
        'element_id', NEW.id,
        'element_type', NEW.type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
