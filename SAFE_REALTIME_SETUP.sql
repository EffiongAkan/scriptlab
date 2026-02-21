-- SAFE REALTIME SETUP
-- This script safely checks if tables are in the publication before adding them.
-- It works even if some tables are already added.

BEGIN;

-- 1. Create publication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- 2. Safely add tables to publication using a loop and exception handling
DO $$
DECLARE
  schema_name text := 'public';
  tables_to_add text[] := ARRAY['script_elements', 'script_activities', 'script_comments', 'script_collaborators'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables_to_add
  LOOP
    -- Check if table is already in publication
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_rel pr 
      JOIN pg_publication p ON pr.prpubid = p.oid
      JOIN pg_class c ON pr.prrelid = c.oid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = t
    ) THEN
      -- Dynamic SQL to add table
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I', schema_name, t);
      RAISE NOTICE 'Added table % to publication', t;
    ELSE
      RAISE NOTICE 'Table % is already in publication', t;
    END IF;
  END LOOP;
END
$$;

-- 3. Set Replica Identity to FULL (Always safe to run)
ALTER TABLE IF EXISTS script_elements REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS script_activities REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS script_comments REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS script_collaborators REPLICA IDENTITY FULL;

COMMIT;

-- 4. Verification Query
SELECT 
    p.pubname, 
    c.relname AS table_name,
    CASE 
        WHEN c.relreplident = 'd' THEN 'default'
        WHEN c.relreplident = 'n' THEN 'nothing'
        WHEN c.relreplident = 'f' THEN 'full'
        WHEN c.relreplident = 'i' THEN 'index'
    END AS replica_identity
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prpubid
JOIN pg_class c ON pr.prrelid = c.oid
WHERE p.pubname = 'supabase_realtime'
ORDER BY table_name;
