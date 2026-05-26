-- CHECK COLUMN TYPES
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('messages', 'mentions', 'scripts', 'script_collaborators', 'ai_rate_limits')
AND table_schema = 'public';
