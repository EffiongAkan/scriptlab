-- Check if elements for a script have identical timestamps
-- This helps us check if 'created_at' is a valid sort key
SELECT 
    script_id, 
    COUNT(*) as total_elements, 
    COUNT(DISTINCT created_at) as distinct_timestamps
FROM script_elements
GROUP BY script_id
HAVING COUNT(*) > 1 AND COUNT(DISTINCT created_at) < COUNT(*)
LIMIT 5;
