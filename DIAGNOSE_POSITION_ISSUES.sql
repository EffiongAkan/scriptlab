-- Diagnostic: Check for position data issues
-- This will help identify why elements appear out of order

-- 1. Check for NULL positions
SELECT 
  script_id,
  COUNT(*) as total_elements,
  COUNT(position) as elements_with_position,
  COUNT(*) - COUNT(position) as null_positions
FROM script_elements
GROUP BY script_id
HAVING COUNT(*) - COUNT(position) > 0;

-- 2. Check for duplicate positions in same script
SELECT 
  script_id,
  position,
  COUNT(*) as duplicate_count
FROM script_elements
GROUP BY script_id, position
HAVING COUNT(*) > 1
ORDER BY script_id, position;

-- 3. Check for negative positions
SELECT 
  script_id,
  id,
  type,
  position,
  LEFT(content, 50) as content_preview
FROM script_elements
WHERE position < 0
ORDER BY script_id, position;

-- 4. Sample data from one script to see position distribution
SELECT 
  id,
  type,
  position,
  LEFT(content, 50) as content_preview,
  created_at
FROM script_elements
WHERE script_id = (SELECT id FROM scripts LIMIT 1)
ORDER BY position
LIMIT 20;
