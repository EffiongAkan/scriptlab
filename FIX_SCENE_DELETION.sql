-- =================================================================================
-- FIX: Scene Deletion - Orphan Rows No Longer Resurrected
--
-- ROOT CAUSE:
-- The `sync_script_elements_bulk` RPC (called by saveScript on every auto-save) was
-- SHIFTING orphaned rows to high position numbers instead of DELETING them.
-- This caused deleted scenes to reappear in the database after the next save.
--
-- SOLUTION:
-- Update sync_script_elements_bulk to DELETE elements that are not in the incoming
-- list. This makes the RPC a true "replace/sync" operation rather than an "upsert + shift".
-- =================================================================================

-- 1. Drop and recreate sync_script_elements_bulk with proper orphan DELETION
CREATE OR REPLACE FUNCTION public.sync_script_elements_bulk(
  p_script_id uuid,
  p_elements jsonb
) RETURNS void AS $$
DECLARE
  v_index int := 0;
BEGIN
  -- Check permission: user must be an editor or admin on this script
  IF NOT public.user_can_edit_script(p_script_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to edit this script.';
  END IF;

  -- Set a local configuration variable to signal the trigger to skip individual logs
  PERFORM set_config('scriptyn.bulk_sync_active', 'true', true);

  -- Defer the unique constraint so rows can swap positions freely mid-transaction
  SET CONSTRAINTS unique_script_position DEFERRED;

  -- Get the count for position assignment
  v_index := jsonb_array_length(p_elements);

  -- 1. DELETE any elements that are in the DB but NOT in the incoming list
  --    This is the key fix: truly removes deleted elements instead of shifting them.
  DELETE FROM public.script_elements
  WHERE script_id = p_script_id
    AND id NOT IN (
      SELECT (value->>'id')::uuid 
      FROM jsonb_array_elements(p_elements)
      WHERE (value->>'id') IS NOT NULL
    );

  -- 2. Bulk Upsert the incoming elements in one fast CTE query
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

COMMENT ON FUNCTION public.sync_script_elements_bulk IS 
'Atomically syncs script elements: upserts incoming rows and DELETES orphans not in the list. 
Uses deferred constraints and bypasses individual activity triggers to prevent timeouts.';


-- 2. Also create a dedicated delete-elements RPC for explicit batch deletions
--    (Bypasses RLS using SECURITY DEFINER, ensuring the operation always succeeds for the owner)
CREATE OR REPLACE FUNCTION public.delete_script_elements(
  p_script_id uuid,
  p_element_ids uuid[]
) RETURNS int AS $$
DECLARE
  v_deleted int;
BEGIN
  -- Check permission: user must be an editor or admin on this script
  IF NOT public.user_can_edit_script(p_script_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to edit this script.';
  END IF;

  DELETE FROM public.script_elements
  WHERE script_id = p_script_id
    AND id = ANY(p_element_ids);
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_script_elements IS 
'Permanently deletes specific script elements by ID. Uses SECURITY DEFINER to bypass RLS for the script owner.';


-- Verify
SELECT 'sync_script_elements_bulk updated to delete orphans' as status;
SELECT 'delete_script_elements RPC created' as status;
