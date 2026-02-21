-- FORCE ENABLE REALTIME
-- This script explicitly ensures all necessary tables are in the realtime publication.
-- It also sets REPLICA IDENTITY to FULL to ensure we get complete data updates.

BEGIN;

-- 1. Ensure the publication exists (it usually does by default)
-- If it doesn't exist, we create it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- 2. Add tables to the publication
-- We use separate statements to avoid "relation already in publication" errors halting the script if we used a single line.
-- (Or we can just ignore errors, but ALTER PUBLICATION SET TABLE is cleaner if we want to reset, but dangerous if other tables exist)
-- We will use a safe approach: try adding each table, catching potential duplication errors? 
-- Actually, proper syntax "ALTER PUBLICATION name ADD TABLE ..." allows multiple.
-- To be safe and idempotent, we check membership first or just try-catch block? 
-- Postgres doesn't support "ADD TABLE IF NOT EXISTS".
-- Simplest way: DROP from publication then ADD (if safe). Or just ignore specific errors.

-- Let's try the direct approach which is most likely to succeed if they are missing.
ALTER PUBLICATION supabase_realtime ADD TABLE script_elements;
ALTER PUBLICATION supabase_realtime ADD TABLE script_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE script_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE script_collaborators; -- For presence/lists

-- 3. Set Replica Identity to FULL
-- This ensures that UPDATE/DELETE events contain all columns in the 'old' record, 
-- causing fewer issues with RLS filtering and client-side handling.
ALTER TABLE script_elements REPLICA IDENTITY FULL;
ALTER TABLE script_activities REPLICA IDENTITY FULL;
ALTER TABLE script_comments REPLICA IDENTITY FULL;
ALTER TABLE script_collaborators REPLICA IDENTITY FULL;

COMMIT;

-- 4. Verify the result
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
