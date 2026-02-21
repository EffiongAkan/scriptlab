
-- Check script_elements constraints and columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'script_elements'
ORDER BY ordinal_position;

-- Simulating the exact sync payload to see why it fails
DO $$
DECLARE
  v_script_id uuid;
  v_element_id uuid;
BEGIN
  -- Get existing element
  SELECT script_id, id INTO v_script_id, v_element_id 
  FROM script_elements 
  LIMIT 1;

  IF v_element_id IS NOT NULL THEN
    RAISE NOTICE 'Testing UPSERT on existing element % (without position)...', v_element_id;
    BEGIN
      INSERT INTO script_elements (id, script_id, type, content)
      VALUES (v_element_id, v_script_id, 'action', 'Updated content via test')
      ON CONFLICT (id) DO UPDATE 
      SET content = EXCLUDED.content;
      RAISE NOTICE 'UPSERT SUCCESS';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'UPSERT FAILED: %', SQLERRM;
    END;
  END IF;
END $$;
