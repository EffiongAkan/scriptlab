-- Check columns in script_activities table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'script_activities';
