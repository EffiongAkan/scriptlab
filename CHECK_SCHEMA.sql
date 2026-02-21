
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'script_activities';

select pg_get_functiondef('record_script_activity'::regproc);
