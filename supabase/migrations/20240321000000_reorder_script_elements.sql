-- Create a function to reorder script elements atomically
CREATE OR REPLACE FUNCTION reorder_script_elements(
  p_script_id UUID,
  p_element_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_id UUID;
  v_position INTEGER;
BEGIN
  -- Iterate through the array of element IDs
  -- The array index (1-based in SQL) determines the new position
  FOR v_position IN 1..array_length(p_element_ids, 1) LOOP
    v_id := p_element_ids[v_position];
    
    -- Update the position of the element
    -- We subtract 1 from v_position because our frontend often uses 0-based indexing
    -- but it depends on your convention. The code seems to use 0-based position.
    UPDATE script_elements
    SET position = v_position - 1,
        updated_at = NOW()
    WHERE id = v_id AND script_id = p_script_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
