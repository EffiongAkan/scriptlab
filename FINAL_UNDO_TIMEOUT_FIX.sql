-- =================================================================================
-- FINAL UNDO TIMEOUT FIX (Statement Timeout Resolution)
--
-- Root Cause: When bulk upserting Script Elements during an Undo/Redo, the trigger
-- `record_script_activity` was firing on every single row. If an undo shifts 1000
-- elements, the database tried to synchronously insert 1000 activity logs, causing
-- the entire transaction to hit the statement timeout limit.
--
-- Solution: 
-- 1. Modify the RPC `sync_script_elements_bulk` to set a transaction-local variable
--    indicating that a bulk sync is active, and insert just ONE bulk activity log.
-- 2. Modify `record_script_activity` to bypass individual logging if the bulk
--    sync variable is set, AND to ignore updates that only shift element positions.
-- =================================================================================

-- 1. Create the ultimate atomic bulk sync function, now with trigger bypass
CREATE OR REPLACE FUNCTION public.sync_script_elements_bulk(
  p_script_id uuid,
  p_elements jsonb
) RETURNS void AS $$
DECLARE
  v_element jsonb;
  v_index int := 0;
BEGIN
  -- Check permission: user must be an editor or admin on this script
  IF NOT public.user_can_edit_script(p_script_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to edit this script.';
  END IF;

  -- Set a local configuration variable to signal the trigger to skip individual logs
  -- 'true' as the third argument means this setting is local to the current transaction
  PERFORM set_config('scriptyn.bulk_sync_active', 'true', true);

  -- Defer the unique constraint so rows can swap positions freely mid-transaction
  SET CONSTRAINTS unique_script_position DEFERRED;

  -- 1. Bulk Upsert in exactly ONE extremely fast query using a CTE
  WITH incoming AS (
    SELECT (value->>'id')::uuid AS id, (ordinality - 1)::integer AS new_position, value
    FROM jsonb_array_elements(p_elements) WITH ORDINALITY
  )
  INSERT INTO public.script_elements (id, script_id, type, content, position)
  SELECT 
    id,
    p_script_id,
    (value->>'type')::script_element_type,
    COALESCE(value->>'content', ''),
    new_position
  FROM incoming
  ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    content = EXCLUDED.content,
    position = EXCLUDED.position,
    updated_at = NOW()
  WHERE script_elements.type IS DISTINCT FROM EXCLUDED.type
     OR script_elements.content IS DISTINCT FROM EXCLUDED.content
     OR script_elements.position IS DISTINCT FROM EXCLUDED.position;

  -- Get total elements inserted for our orphan offset
  v_index := jsonb_array_length(p_elements);
  
  -- 2. Cleanup: Shift any orphaned elements instantly
  WITH orphans AS (
    SELECT id, row_number() OVER (ORDER BY position) as seq
    FROM public.script_elements
    WHERE script_id = p_script_id 
      AND id NOT IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(p_elements))
  )
  UPDATE public.script_elements e
  SET position = v_index + o.seq,
      updated_at = NOW()
  FROM orphans o
  WHERE e.id = o.id
    AND e.position IS DISTINCT FROM (v_index + o.seq);

  -- 3. Manually insert a single activity record for the bulk sync instead of thousands
  INSERT INTO public.script_activities (script_id, user_id, action_type, details)
  VALUES (
    p_script_id, 
    auth.uid(), 
    'bulk_sync', 
    jsonb_build_object('elements_synced', v_index)
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_script_elements_bulk IS 'Atomically bulk upserts and reorders script elements using deferred constraints. Bypasses individual activity logging to prevent timeouts.';


-- 2. Update the Activity Trigger to respect the bypass flag and ignore simple position shifts
CREATE OR REPLACE FUNCTION public.record_script_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- If a bulk sync is running, DO NOT log individual row changes. The RPC will log one bulk event.
  -- current_setting with true (missing_ok) prevents crashing if the setting doesn't exist
  IF current_setting('scriptyn.bulk_sync_active', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only log activity if there's an authenticated user
  IF auth.uid() IS NOT NULL THEN
    
    -- Optimization: For standard updates, ignore if only the position changed.
    -- (This prevents spam if another function shifts positions without the bulk flag)
    IF TG_OP = 'UPDATE' THEN
      IF (OLD.content IS NOT DISTINCT FROM NEW.content AND OLD.type IS NOT DISTINCT FROM NEW.type) THEN
        RETURN NEW;
      END IF;
    END IF;

    -- Standard individual activity logging
    INSERT INTO script_activities (
      script_id,
      user_id,
      action_type, 
      details
    ) VALUES (
      COALESCE(NEW.script_id, OLD.script_id),
      auth.uid(),
      TG_OP,
      jsonb_build_object(
        'element_id', COALESCE(NEW.id, OLD.id),
        'element_type', COALESCE(NEW.type, OLD.type)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.record_script_activity IS 'Logs changes to script elements. Optimized to skip bulk sync operations and simple position shifts.';
