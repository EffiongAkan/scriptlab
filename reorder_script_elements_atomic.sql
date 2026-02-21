-- 1. Make UNIQUE constraint deferrable
-- This allows swapping positions within a single transaction without causing immediate errors
ALTER TABLE public.script_elements 
DROP CONSTRAINT IF EXISTS unique_script_position;

ALTER TABLE public.script_elements 
ADD CONSTRAINT unique_script_position 
UNIQUE (script_id, position) 
DEFERRABLE INITIALLY IMMEDIATE;

-- 2. Create Atomic Reorder Function
-- This function reindexes all elements sequentially in a single transaction
CREATE OR REPLACE FUNCTION reorder_script_elements_atomic(
  p_script_id UUID,
  p_element_ids UUID[]
) RETURNS VOID AS $$
BEGIN
  -- Defer unique constraint check to the end of the transaction
  SET CONSTRAINTS unique_script_position DEFERRED;

  -- Perform bulk update
  FOR i IN 1..array_length(p_element_ids, 1) LOOP
    UPDATE public.script_elements
    SET position = i - 1,
        updated_at = NOW()
    WHERE id = p_element_ids[i] 
      AND script_id = p_script_id;
  END LOOP;
  
  -- The constraint check will happen automatically at COMMIT
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the function
COMMENT ON FUNCTION reorder_script_elements_atomic IS 'Atomically reorders script elements and ensures position uniqueness by deferring constraints.';
