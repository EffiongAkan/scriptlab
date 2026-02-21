
-- Diagnostic script to identify save failure cause and check constraints

-- 1. Check script_activities columns
SELECT 'Checking script_activities columns' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'script_activities'
ORDER BY ordinal_position;

-- 2. Check check constraints on script_activities
SELECT 'Checking check constraints' as check_type;
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'script_activities';

-- 3. Check ENUM types?
-- (If action_type is an enum, it will show as USER-DEFINED in data_type)

-- 4. Test insert into script_activities directly
DO $$
DECLARE
  v_user_id uuid := auth.uid();
  v_script_id uuid;
BEGIN
  -- Get a valid script id if possible
  SELECT id INTO v_script_id FROM scripts LIMIT 1;
  
  IF v_script_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing direct insert into script_activities...';
    BEGIN
      -- Try with 'editing' first (most likely valid)
      INSERT INTO script_activities (script_id, user_id, action_type, details)
      VALUES (v_script_id, v_user_id, 'editing', '{"test": true}'::jsonb);
      RAISE NOTICE 'Direct insert (editing) SUCCESS';
      
      -- Try with 'INSERT' to see if that fails (testing my hypothesis)
      BEGIN
        INSERT INTO script_activities (script_id, user_id, action_type, details)
        VALUES (v_script_id, v_user_id, 'INSERT', '{"test": true}'::jsonb);
        RAISE NOTICE 'Direct insert (INSERT) SUCCESS';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Direct insert (INSERT) FAILED: %', SQLERRM;
      END;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Direct insert (editing) FAILED: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Skipping direct insert test (no script or user found)';
  END IF;
END $$;
