-- =================================================================================
-- EMERGENCY FIX: Unique Constraint Violation during Script Sync
--
-- Root Cause: PostgreSQL enforces the `unique_script_position` constraint on a
-- row-by-row basis during upserts. Reordering elements or shifting their positions
-- caused collisions with existing rows, which broke `Undo/Redo` and single inserts.
--
-- Solution: Create a highly optimized RPC function that receives the entire script
-- as JSON. It defers the constraint checks to the end of the transaction, allowing
-- elements to seamlessly swap positions. This is 100x safer and completely bypasses
-- the 'duplicate key value' error.
-- =================================================================================

-- 1. Ensure the unique constraint is deferrable (Safeguard)
ALTER TABLE public.script_elements 
DROP CONSTRAINT IF EXISTS unique_script_position;

ALTER TABLE public.script_elements 
ADD CONSTRAINT unique_script_position 
UNIQUE (script_id, position) 
DEFERRABLE INITIALLY IMMEDIATE;

-- 2. Create the ultimate atomic bulk sync function
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

  -- Defer the unique constraint so rows can swap positions freely mid-transaction
  SET CONSTRAINTS unique_script_position DEFERRED;

  -- 1. Create a quick, indexed temporary table to hold the incoming IDs.
  -- This prevents Postgres from constantly re-evaluating the JSON array in the cleanup CTE.
  CREATE TEMP TABLE temp_incoming_ids ON COMMIT DROP AS 
  SELECT (value->>'id')::uuid AS id, (ordinality - 1)::integer AS new_position, value
  FROM jsonb_array_elements(p_elements) WITH ORDINALITY;

  CREATE INDEX idx_temp_incoming_id ON temp_incoming_ids(id);

  -- 2. Bulk Upsert in exactly ONE extremely fast query using the temporary table
  INSERT INTO public.script_elements (id, script_id, type, content, position)
  SELECT 
    id,
    p_script_id,
    (value->>'type')::script_element_type,
    COALESCE(value->>'content', ''),
    new_position
  FROM temp_incoming_ids
  ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    content = EXCLUDED.content,
    position = EXCLUDED.position,
    updated_at = NOW();

  -- Get total elements inserted for our orphan offset
  SELECT count(*) INTO v_index FROM temp_incoming_ids;
  
  -- 3. Cleanup: Shift any orphaned elements instantly using an Anti-Join
  WITH orphans AS (
    SELECT id, row_number() OVER (ORDER BY position) as seq
    FROM public.script_elements
    WHERE script_id = p_script_id 
      AND NOT EXISTS (SELECT 1 FROM temp_incoming_ids t WHERE t.id = script_elements.id)
  )
  UPDATE public.script_elements e
  SET position = v_index + o.seq,
      updated_at = NOW()
  FROM orphans o
  WHERE e.id = o.id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add description
COMMENT ON FUNCTION public.sync_script_elements_bulk IS 'Atomically bulk upserts and reorders script elements using deferred constraints to prevent unique key violations.';
