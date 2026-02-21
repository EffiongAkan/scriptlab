-- CHECK ACTIVITIES AND TRIGGERS
-- Check if we have any activities
SELECT count(*) FROM script_activities;

-- Check if we have any triggers on script_elements
SELECT event_object_table, trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'script_elements';
