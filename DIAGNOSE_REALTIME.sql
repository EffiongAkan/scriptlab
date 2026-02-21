-- DIAGNOSE REALTIME SETUP
-- Check if tables are in 'supabase_realtime' publication
-- Check Replica Identity
-- Check if RLS is enabled on these tables

SELECT 
    p.pubname, 
    n.nspname AS schema_name, 
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
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE p.pubname = 'supabase_realtime'
ORDER BY table_name;

-- Check RLS status
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('script_elements', 'script_comments', 'script_activities', 'script_collaborators');
