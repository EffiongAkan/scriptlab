-- COMPREHENSIVE REPAIR: Fix Positions, Triggers, and Constraints
-- Run this entire script in Supabase SQL Editor

-- 1. FIX TRIGGER (Allow migrations/system ops)
CREATE OR REPLACE FUNCTION record_script_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO script_activities (script_id, user_id, action_type, details)
    VALUES (NEW.script_id, auth.uid(), TG_OP, 
    jsonb_build_object('element_id', NEW.id, 'element_type', NEW.type));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. REINDEX FUNCTION (Bulk repair)
CREATE OR REPLACE FUNCTION fix_script_element_positions(p_script_id UUID)
RETURNS void AS $$
BEGIN
  WITH numbered_elements AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) - 1 as new_position
    FROM script_elements WHERE script_id = p_script_id
  )
  UPDATE script_elements se
  SET position = ne.new_position, updated_at = NOW()
  FROM numbered_elements ne
  WHERE se.id = ne.id AND se.position != ne.new_position;
END;
$$ LANGUAGE plpgsql;

-- 3. RUN REPAIR FOR ALL SCRIPTS
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT script_id FROM script_elements LOOP
    PERFORM fix_script_element_positions(r.script_id);
  END LOOP;
END $$;

-- 4. ATOMIC REORDER RPC (For Frontend)
CREATE OR REPLACE FUNCTION reorder_script_elements_atomic(
  p_script_id UUID,
  p_element_ids UUID[]
) RETURNS VOID AS $$
BEGIN
  SET CONSTRAINTS unique_script_position DEFERRED;
  FOR i IN 1..array_length(p_element_ids, 1) LOOP
    UPDATE script_elements
    SET position = i - 1, updated_at = NOW()
    WHERE id = p_element_ids[i] AND script_id = p_script_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DEFERRABLE UNIQUE CONSTRAINT
ALTER TABLE script_elements DROP CONSTRAINT IF EXISTS unique_script_position;
ALTER TABLE script_elements ADD CONSTRAINT unique_script_position 
UNIQUE (script_id, position) DEFERRABLE INITIALLY IMMEDIATE;

-- 6. INDEX
CREATE INDEX IF NOT EXISTS idx_script_elements_script_position ON script_elements(script_id, position);

-- CLEANUP
DROP FUNCTION IF EXISTS fix_script_element_positions(UUID);

-- FINAL CHECK
SELECT 'SUCCESS' as status, COUNT(*) as duplicates
FROM (SELECT script_id, position FROM script_elements GROUP BY script_id, position HAVING COUNT(*) > 1) d;
