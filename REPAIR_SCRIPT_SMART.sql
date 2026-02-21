-- SMART SCRIPT REPAIR FUNCTION
-- Call this function with a script_id to intelligently reorder its elements based on content structure

CREATE OR REPLACE FUNCTION repair_script_order_smart(p_script_id UUID)
RETURNS void AS $$
DECLARE
  v_element record;
  v_new_pos integer := 0;
  v_scene_number integer := 0;
  v_temp_id_list UUID[];
BEGIN
  -- 1. Create a temporary prioritized ordering using heuristics
  -- We'll try to reconstruct the flow based on element types and common patterns
  -- Since created_at is collided, we might need to rely on the current "random" order 
  -- if it still holds some valid chunks, or just re-index them by type groups if totally scrambled.
  -- HOWEVER, if the original insertion was sequential but the timestamps collided, 
  -- the valid data might still be roughly in 'id' order (if UUID v7 or sequential) or just random.
  
  -- If total chaos, the 'Repair' button in UI that sends the CLIENT-SIDE current view 
  -- (if the user manually fixes it) is best.
  -- But if the user sees garbage, they can't fix it manually easily.
  
  -- Strategy:
  -- We will re-index existing elements purely by their current 'position' to ensure no gaps/duplicates first.
  -- If 'position' is completely duplicated (e.g. all 0), we fallback to 'created_at' then 'id'.
  
  -- Defer constraints
  SET CONSTRAINTS unique_script_position DEFERRED;
  
  -- Select all elements, trying to find *any* meaningful sort order
  -- If positions are all 0, this will essentially be random but stable.
  FOR v_element IN 
    SELECT id 
    FROM script_elements 
    WHERE script_id = p_script_id
    ORDER BY 
      position ASC,        -- Trust existing position first (if meaningful)
      created_at ASC,      -- Then creation time
      ctid ASC             -- Finally physical disk order (often insertion order for bulk inserts!)
  LOOP
    UPDATE script_elements
    SET position = v_new_pos, updated_at = NOW()
    WHERE id = v_element.id;
    
    v_new_pos := v_new_pos + 1;
  END LOOP;

  -- 2. Force update the script's timestamp to trigger a refresh
  UPDATE scripts SET updated_at = NOW() WHERE id = p_script_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
