-- Quick diagnostic: Show me scripts with position issues
-- Run this single query to see everything at once

-- Get a script ID that has actual content
WITH sample_script AS (
  SELECT script_id, COUNT(*) as element_count
  FROM script_elements
  GROUP BY script_id
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
-- Show all elements from that script
SELECT 
  se.position,
  se.type,
  LEFT(se.content, 60) as content_preview,
  se.created_at::date as created_date
FROM script_elements se
JOIN sample_script ss ON se.script_id = ss.script_id
ORDER BY se.position ASC
LIMIT 50;

-- Also check for duplicate positions across all scripts
SELECT 'Duplicate Positions Found:' as issue_type, COUNT(*) as issue_count
FROM (
  SELECT script_id, position, COUNT(*) as dup_count
  FROM script_elements
  GROUP BY script_id, position
  HAVING COUNT(*) > 1
) duplicates;
